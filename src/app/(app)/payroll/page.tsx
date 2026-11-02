import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { computeTeacherPay } from "@/lib/payroll";
import { generatePayslips, setPayslipStatus } from "@/app/actions/payroll";
import { fmtAr } from "@/lib/format";

export default async function Payroll({ searchParams }: { searchParams: { month?: string } }) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7);

  if (u.role === "TEACHER") {
    const t = await prisma.teacher.findUniqueOrThrow({ where: { userId: u.id } });
    const slips = await prisma.payslip.findMany({ where: { teacherId: t.id }, orderBy: { month: "desc" } });
    return (
      <>
        <h1>Ma paie</h1>
        <table>
          <thead><tr><th>Mois</th><th>Heures</th><th>Taux</th><th>Brut</th><th>Statut</th></tr></thead>
          <tbody>
            {slips.map((p) => (
              <tr key={p.id}><td>{p.month}</td><td>{(p.totalMinutes / 60).toFixed(2)}</td>
                <td>{fmtAr(Number(p.hourlyRate))}</td><td>{fmtAr(Number(p.gross))}</td>
                <td><span className={`tag ${p.status}`}>{p.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (!isStaff(u.role)) throw new Error("Forbidden");
  const teachers = await prisma.teacher.findMany({
    include: { user: true, payslips: { where: { month } } },
    orderBy: { user: { name: "asc" } },
  });
  const rows = await Promise.all(teachers.map(async (t) => ({ t, calc: await computeTeacherPay(t.id, month), slip: t.payslips[0] })));
  const total = rows.reduce((s, r) => s + Number(r.calc.gross), 0);

  return (
    <>
      <h1>Paie mpampianatra</h1>
      <form method="get" style={{ display: "flex", gap: 8 }}>
        <input type="month" name="month" defaultValue={month} /><button>Hijery</button>
      </form>
      <table style={{ marginTop: 16 }}>
        <thead><tr><th>Prof</th><th>Ora</th><th>Taux</th><th>Brut (kajy)</th><th>Payslip</th></tr></thead>
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
                      <option value="DRAFT">Brouillon</option><option value="VALIDATED">Validé</option><option value="PAID">Payé</option>
                    </select>
                    <button>OK</button>
                  </form>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><b>Total: {fmtAr(total)}</b></p>
      <form action={generatePayslips}>
        <input type="hidden" name="month" value={month} />
        <button>Mamorona / manavao ny payslip (brouillon)</button>
      </form>
      <p className="muted">Ny payslip VALIDATED na PAID dia tsy ovaina intsony rehefa mamorona indray.</p>
    </>
  );
}
