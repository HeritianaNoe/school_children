import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addComment } from "@/app/actions/comments";
import { fmtAr } from "@/lib/format";
import { PAYSLIP_STATUS_LABEL } from "@/lib/labels";

export default async function TeacherPage({ params }: { params: { id: string } }) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const t = await prisma.teacher.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!t) notFound();

  const since = new Date(Date.now() - 30 * 86400_000);
  const att = await prisma.teacherAttendance.groupBy({
    by: ["status"], where: { teacherId: t.id, session: { startsAt: { gte: since } } }, _count: { _all: true },
  });
  const count = (k: string) => att.find((a) => a.status === k)?._count._all ?? 0;
  const comments = await prisma.comment.findMany({ where: { teacherId: t.id }, orderBy: { createdAt: "desc" }, include: { author: true } });
  const payslips = await prisma.payslip.findMany({ where: { teacherId: t.id }, orderBy: { month: "desc" }, take: 12 });

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

      <h2>Fiches de paie</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Mois</th><th>Heures</th><th>Brut</th><th>Statut</th></tr></thead>
        <tbody>
          {payslips.map((p) => (
            <tr key={p.id}><td>{p.month}</td><td>{(p.totalMinutes / 60).toFixed(2)}</td>
              <td>{fmtAr(Number(p.gross))}</td><td><span className={`tag ${p.status}`}>{PAYSLIP_STATUS_LABEL[p.status]}</span></td></tr>
          ))}
          {payslips.length === 0 && (<tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: 24 }}>Aucune fiche de paie.</td></tr>)}
        </tbody>
      </table></div>

      <h2>Commentaires</h2>
      <form action={addComment} className="stack card">
        <input type="hidden" name="teacherId" value={t.id} />
        <textarea name="body" rows={3} required maxLength={2000} placeholder="Saisir un commentaire…" />
        <div><button type="submit">Ajouter le commentaire</button></div>
      </form>
      {comments.map((c) => (
        <div className="card" key={c.id}>
          <div className="muted">{c.author.name} · {c.createdAt.toLocaleString("fr-FR")}</div>
          <div>{c.body}</div>
        </div>
      ))}
    </>
  );
}
