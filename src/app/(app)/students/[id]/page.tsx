import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { studentAverage } from "@/lib/grades";
import { addComment } from "@/app/actions/comments";
import { fmtDate } from "@/lib/format";

export default async function StudentPage({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const s = await prisma.student.findUnique({ where: { id: params.id }, include: { user: true, classe: true } });
  if (!s) notFound();
  if (u.role === "PARENT") throw new Error("Forbidden");
  if (u.role === "STUDENT" && s.userId !== u.id) throw new Error("Forbidden");
  const staffView = u.role !== "STUDENT";

  const since = new Date(Date.now() - 30 * 86400_000);
  const att = await prisma.studentAttendance.groupBy({
    by: ["status"], where: { studentId: s.id, session: { startsAt: { gte: since } } }, _count: { _all: true },
  });
  const count = (k: string) => att.find((a) => a.status === k)?._count._all ?? 0;

  const terms = await prisma.term.findMany({ orderBy: { startDate: "asc" } });
  const averages = await Promise.all(terms.map(async (t) => ({ t, avg: await studentAverage(s.id, t.id) })));
  const grades = await prisma.grade.findMany({
    where: { studentId: s.id }, orderBy: { assessment: { date: "desc" } }, take: 20,
    include: { assessment: { include: { course: { include: { subject: true } } } } },
  });
  const comments = staffView
    ? await prisma.comment.findMany({ where: { studentId: s.id }, orderBy: { createdAt: "desc" }, include: { author: true } })
    : [];

  return (
    <>
      <h1>{s.user.name}</h1>
      <p className="muted">{s.matricule} · {s.classe.name}</p>

      <h2>Présence (30 andro)</h2>
      <div className="grid">
        <div className="card">Tonga: <b>{count("PRESENT")}</b></div>
        <div className="card">Tara: <b>{count("LATE")}</b></div>
        <div className="card">Absent: <b>{count("ABSENT")}</b></div>
        <div className="card">Justifié: <b>{count("EXCUSED")}</b></div>
      </div>

      <h2>Salan'isa</h2>
      <div className="grid">
        {averages.map(({ t, avg }) => (
          <div className="card" key={t.id}>
            <div className="muted">{t.name}</div>
            <div style={{ fontSize: 26 }}>{avg ?? "—"}{avg != null && "/20"}</div>
          </div>
        ))}
      </div>

      <h2>Noty farany</h2>
      <table>
        <thead><tr><th>Daty</th><th>Matière</th><th>Évaluation</th><th>Noty</th></tr></thead>
        <tbody>
          {grades.map((g) => (
            <tr key={g.id}><td>{fmtDate(g.assessment.date)}</td><td>{g.assessment.course.subject.name}</td>
              <td>{g.assessment.title}</td><td>{g.score ?? "Abs"} / {g.assessment.maxScore}</td></tr>
          ))}
        </tbody>
      </table>

      {staffView && (
        <>
          <h2>Commentaires</h2>
          <form action={addComment} className="stack card">
            <input type="hidden" name="studentId" value={s.id} />
            <textarea name="body" rows={3} required placeholder="Soraty eto…" />
            <button>Ampiana</button>
          </form>
          {comments.map((c) => (
            <div className="card" key={c.id}>
              <div className="muted">{c.author.name} · {c.createdAt.toLocaleString("fr-FR")}</div>
              <div>{c.body}</div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
