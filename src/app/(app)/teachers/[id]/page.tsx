import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addComment } from "@/app/actions/comments";
import { fmtAr } from "@/lib/format";
import { PAYSLIP_STATUS_LABEL, TEACHER_STATUS_LABEL } from "@/lib/labels";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";
import AddDialog from "@/components/AddDialog";
import Link from "next/link";
import Icon from "@/components/Icons";
import { fmtUtcDate } from "@/lib/format";

export default async function TeacherPage({
  params: paramsP,
  searchParams: searchParamsP,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await paramsP;
  const searchParams = await searchParamsP;
  await requireUser(["ADMIN", "DIRECTOR"]);
  const t = await prisma.teacher.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!t) notFound();

  const since = new Date(Date.now() - 30 * 86400_000);
  const [att, comments, allPayslips, contracts, currentYear] = await Promise.all([
    prisma.teacherAttendance.groupBy({
      by: ["status"], where: { teacherId: t.id, session: { startsAt: { gte: since } } }, _count: { _all: true },
    }),
    prisma.comment.findMany({ where: { teacherId: t.id }, orderBy: { createdAt: "desc" }, include: { author: true } }),
    prisma.payslip.findMany({ where: { teacherId: t.id }, orderBy: { month: "desc" } }),
    prisma.teacherContract.findMany({
      where: { teacherId: t.id },
      include: { schoolYear: true },
      orderBy: { schoolYear: { startDate: "desc" } },
    }),
    prisma.schoolYear.findFirst({ where: { isCurrent: true }, select: { id: true, name: true } }),
  ]);
  const count = (k: string) => att.find((a) => a.status === k)?._count._all ?? 0;
  const contract = contracts.find((c) => c.schoolYear.isCurrent) ?? null;
  const pastContracts = contracts.filter((c) => c.id !== contract?.id);
  // Taux horaire ou statut modifiés depuis la génération du contrat
  const outdated = !!contract && (Number(contract.hourlyRate) !== Number(t.hourlyRate) || contract.status !== t.status);
  const { items: payslips, page, totalPages, total } = paginate(allPayslips, searchParams.page);
  const pdf = {
    title: `Fiches de paie - ${t.user.name}`,
    subtitle: `Taux horaire : ${fmtAr(Number(t.hourlyRate))} / heure`,
    headers: ["Mois", "Heures", "Brut", "Statut"],
    rows: allPayslips.map((p) => [
      p.month,
      (p.totalMinutes / 60).toFixed(2),
      fmtAr(Number(p.gross)),
      PAYSLIP_STATUS_LABEL[p.status] ?? p.status,
    ]),
  };

  return (
    <>
      <h1>{t.user.name}</h1>
      <p className="muted">Taux horaire : {fmtAr(Number(t.hourlyRate))} / heure</p>
      <h2>Présence (30 derniers jours)</h2>
      <div className="grid">
        <div className="stat-card"><div className="label">Présences</div><div className="value">{count("PRESENT")}</div></div>
        <div className="stat-card"><div className="label">Retards</div><div className="value">{count("LATE")}</div></div>
        <div className="stat-card"><div className="label">Absences</div><div className="value">{count("ABSENT")}</div></div>
        <div className="stat-card"><div className="label">Absences justifiées</div><div className="value">{count("EXCUSED")}</div></div>
      </div>

      <h2>Contrat{currentYear ? ` — ${currentYear.name}` : ""}</h2>
      {contract ? (
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div><b>{contract.number}</b></div>
            <div className="muted">
              {fmtUtcDate(contract.startDate)} → {fmtUtcDate(contract.endDate)} · {TEACHER_STATUS_LABEL[contract.status]} · {fmtAr(Number(contract.hourlyRate))} / heure
            </div>
            {outdated && <div className="muted" style={{ marginTop: 6 }}>Taux horaire ou statut modifié depuis la génération du contrat.</div>}
          </div>
          <Link href={`/teachers/${t.id}/contract`} className="btn">
            <Icon name="fileText" size={16} />
            Ouvrir le contrat
          </Link>
        </div>
      ) : (
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="muted">{currentYear ? "Aucun contrat pour l'année scolaire courante." : "Aucune année scolaire courante définie."}</span>
          {currentYear && <Link href={`/teachers/${t.id}/contract`} className="btn-secondary btn">Ouvrir la page du contrat</Link>}
        </div>
      )}
      {pastContracts.length > 0 && (
        <p className="muted" style={{ marginTop: 8 }}>
          Contrats précédents :{" "}
          {pastContracts.map((c, i) => (
            <span key={c.id}>
              {i > 0 && " · "}
              <Link href={`/teachers/${t.id}/contract?c=${c.id}`}>{c.schoolYear.name}</Link>
            </span>
          ))}
        </p>
      )}

      <h2>Fiches de paie</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Mois</th><th>Heures</th><th>Brut</th><th>Statut</th><th className="no-print" style={{ width: 60 }}></th></tr></thead>
        <tbody>
          {payslips.map((p) => (
            <tr key={p.id}><td>{p.month}</td><td>{(p.totalMinutes / 60).toFixed(2)}</td>
              <td>{fmtAr(Number(p.gross))}</td><td><span className={`tag ${p.status}`}>{PAYSLIP_STATUS_LABEL[p.status]}</span></td>
              <td className="no-print">
                <AddDialog label="Voir la fiche de paie" title={`Fiche de paie — ${p.month}`} icon="eye" iconOnly className="btn-ghost btn-sm" maxWidth={480}>
                  <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 20px", margin: 0 }}>
                    <dt className="muted">Enseignant</dt><dd style={{ margin: 0 }}>{t.user.name}</dd>
                    <dt className="muted">Mois</dt><dd style={{ margin: 0 }}>{p.month}</dd>
                    <dt className="muted">Heures effectuées</dt><dd style={{ margin: 0 }}>{(p.totalMinutes / 60).toFixed(2)} h</dd>
                    <dt className="muted">Taux horaire</dt><dd style={{ margin: 0 }}>{fmtAr(Number(p.hourlyRate))} / heure</dd>
                    <dt className="muted">Brut</dt><dd style={{ margin: 0 }}><b>{fmtAr(Number(p.gross))}</b></dd>
                    <dt className="muted">Statut</dt><dd style={{ margin: 0 }}><span className={`tag ${p.status}`}>{PAYSLIP_STATUS_LABEL[p.status]}</span></dd>
                    <dt className="muted">Générée le</dt><dd style={{ margin: 0 }}>{p.createdAt.toLocaleDateString("fr-FR")}</dd>
                  </dl>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" data-dialog-close>Fermer</button>
                  </div>
                </AddDialog>
              </td></tr>
          ))}
          {payslips.length === 0 && (<tr><td colSpan={5} className="muted" style={{ textAlign: "center", padding: 24 }}>Aucune fiche de paie.</td></tr>)}
        </tbody>
      </table></div>
      <TableFooter path={`/teachers/${t.id}`} page={page} totalPages={totalPages} total={total} pdf={pdf} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "32px 0 14px" }}>
        <h2 style={{ margin: 0 }}>Commentaires</h2>
        <AddDialog label="Ajouter un commentaire" title="Ajouter un commentaire" maxWidth={520}>
          <form action={addComment}>
            <input type="hidden" name="teacherId" value={t.id} />
            <label>
              Commentaire *
              <textarea name="body" rows={5} required maxLength={2000} placeholder="Saisir un commentaire…" />
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" data-dialog-close>Annuler</button>
              <button type="submit">Ajouter</button>
            </div>
          </form>
        </AddDialog>
      </div>
      {comments.map((c) => (
        <div className="card" key={c.id}>
          <div className="muted">{c.author.name} · {c.createdAt.toLocaleString("fr-FR")}</div>
          <div style={{ marginTop: 6 }}>{c.body}</div>
        </div>
      ))}
      {comments.length === 0 && <p className="muted">Aucun commentaire.</p>}
    </>
  );
}
