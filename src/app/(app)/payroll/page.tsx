import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { computeAllTeacherPay } from "@/lib/payroll";
import { generatePayslips, setPayslipStatus } from "@/app/actions/payroll";
import { fmtAr } from "@/lib/format";
import { PAYSLIP_STATUS_LABEL } from "@/lib/labels";
import { forbidden } from "@/lib/flash";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";

export default async function Payroll({ searchParams }: { searchParams: { month?: string; page?: string } }) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7);

  if (u.role === "TEACHER") {
    const t = await prisma.teacher.findUniqueOrThrow({ where: { userId: u.id } });
    const allSlips = await prisma.payslip.findMany({ where: { teacherId: t.id }, orderBy: { month: "desc" } });
    const { items: slips, page, totalPages, total } = paginate(allSlips, searchParams.page);
    const pdf = {
      title: "Ma paie",
      subtitle: `${total} fiche${total > 1 ? "s" : ""} de paie`,
      headers: ["Mois", "Heures", "Taux horaire", "Brut", "Statut"],
      rows: allSlips.map((p) => [
        p.month,
        (p.totalMinutes / 60).toFixed(2),
        fmtAr(Number(p.hourlyRate)),
        fmtAr(Number(p.gross)),
        PAYSLIP_STATUS_LABEL[p.status] ?? p.status,
      ]),
    };
    return (
      <>
        <h1>Ma paie</h1>
        <div className="table-wrap">
        <table>
          <thead><tr><th>Mois</th><th>Heures</th><th>Taux horaire</th><th>Brut</th><th>Statut</th></tr></thead>
          <tbody>
            {slips.map((p) => (
              <tr key={p.id}><td>{p.month}</td><td>{(p.totalMinutes / 60).toFixed(2)}</td>
                <td>{fmtAr(Number(p.hourlyRate))}</td><td>{fmtAr(Number(p.gross))}</td>
                <td><span className={`tag ${p.status}`}>{PAYSLIP_STATUS_LABEL[p.status]}</span></td></tr>
            ))}
            {slips.length === 0 && (<tr><td colSpan={5} className="muted" style={{ textAlign: "center", padding: 24 }}>Aucune fiche de paie pour le moment.</td></tr>)}
          </tbody>
        </table>
        </div>
        <TableFooter path="/payroll" page={page} totalPages={totalPages} total={total} pdf={pdf} />
      </>
    );
  }

  if (!isStaff(u.role)) forbidden();
  const [teachers, pay] = await Promise.all([
    prisma.teacher.findMany({
      include: { user: true, payslips: { where: { month } } },
      orderBy: { user: { name: "asc" } },
    }),
    computeAllTeacherPay(month), // 2 requêtes pour tous les enseignants (avant : 2 par enseignant)
  ]);
  const allRows = teachers.map((t) => ({ t, calc: pay.get(t.id)!, slip: t.payslips[0] }));
  const total = allRows.reduce((s, r) => s + Number(r.calc.gross), 0);
  const { items: rows, page, totalPages, total: count } = paginate(allRows, searchParams.page);
  const pdf = {
    title: "Paie des enseignants",
    subtitle: `Mois : ${month} · Total brut : ${fmtAr(total)}`,
    headers: ["Enseignant", "Heures", "Taux horaire", "Brut (calculé)", "Fiche de paie"],
    rows: allRows.map(({ t, calc, slip }) => [
      t.user.name,
      (calc.totalMinutes / 60).toFixed(2),
      fmtAr(Number(t.hourlyRate)),
      fmtAr(Number(calc.gross)),
      slip ? PAYSLIP_STATUS_LABEL[slip.status] ?? slip.status : "—",
    ]),
  };

  return (
    <>
      <h1>Paie des enseignants</h1>
      <form method="get" className="inline-form">
        <input type="month" name="month" defaultValue={month} aria-label="Mois" /><button type="submit">Afficher</button>
      </form>
      <div className="table-wrap" style={{ marginTop: 16 }}><table>
        <thead><tr><th>Enseignant</th><th>Heures</th><th>Taux horaire</th><th>Brut (calculé)</th><th>Fiche de paie</th></tr></thead>
        <tbody>
          {rows.map(({ t, calc, slip }) => (
            <tr key={t.id}>
              <td>{t.user.name}</td>
              <td>{(calc.totalMinutes / 60).toFixed(2)}</td>
              <td>{fmtAr(Number(t.hourlyRate))}</td>
              <td>{fmtAr(Number(calc.gross))}</td>
              <td>
                {slip ? (
                  <form action={setPayslipStatus} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={slip.id} />
                    <select name="status" defaultValue={slip.status}>
                      <option value="DRAFT">Brouillon</option><option value="VALIDATED">Validée</option><option value="PAID">Payée</option>
                    </select>
                    <button type="submit" className="btn-secondary btn-sm">Mettre à jour</button>
                  </form>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <TableFooter path="/payroll" params={{ month }} page={page} totalPages={totalPages} total={count} pdf={pdf} />
      <p style={{ marginTop: 12 }}><b>Total : {fmtAr(total)}</b></p>
      <form action={generatePayslips}>
        <input type="hidden" name="month" value={month} />
        <button type="submit">Générer / actualiser les fiches de paie (brouillon)</button>
      </form>
      <p className="muted" style={{ marginTop: 8 }}>Les fiches validées ou payées ne sont plus modifiées lors d&apos;une nouvelle génération.</p>
    </>
  );
}
