import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addComment } from "@/app/actions/comments";
import { fmtAr } from "@/lib/format";

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
      <p className="muted">Taux: {fmtAr(Number(t.hourlyRate))} / ora</p>
      <h2>Présence (30 andro)</h2>
      <div className="grid">
        <div className="card">Tonga: <b>{count("PRESENT")}</b></div>
        <div className="card">Tara: <b>{count("LATE")}</b></div>
        <div className="card">Absent: <b>{count("ABSENT")}</b></div>
        <div className="card">Justifié: <b>{count("EXCUSED")}</b></div>
      </div>

      <h2>Payslips</h2>
      <table>
        <thead><tr><th>Volana</th><th>Ora</th><th>Brut</th><th>Status</th></tr></thead>
        <tbody>
          {payslips.map((p) => (
            <tr key={p.id}><td>{p.month}</td><td>{(p.totalMinutes / 60).toFixed(2)}</td>
              <td>{fmtAr(Number(p.gross))}</td><td><span className={`tag ${p.status}`}>{p.status}</span></td></tr>
          ))}
        </tbody>
      </table>

      <h2>Commentaires</h2>
      <form action={addComment} className="stack card">
        <input type="hidden" name="teacherId" value={t.id} />
        <textarea name="body" rows={3} required />
        <button>Ampiana</button>
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
