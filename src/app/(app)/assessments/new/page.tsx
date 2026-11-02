import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createAssessment } from "@/app/actions/grades";

export default async function NewAssessment() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const [courses, terms] = await Promise.all([
    prisma.course.findMany({
      where: u.role === "TEACHER" ? { teacher: { userId: u.id } } : {},
      include: { classe: true, subject: true },
    }),
    prisma.term.findMany({ orderBy: { startDate: "asc" } }),
  ]);
  return (
    <>
      <h1>Évaluation vaovao</h1>
      <form action={createAssessment} className="stack">
        <label>Cours<select name="courseId">{courses.map((c) => <option key={c.id} value={c.id}>{c.classe.name} · {c.subject.name}</option>)}</select></label>
        <label>Période<select name="termId">{terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>Titre<input name="title" required /></label>
        <label>Karazana<select name="type"><option value="HOMEWORK">Devoir</option><option value="TEST">Interro</option><option value="EXAM">Examen</option></select></label>
        <label>Noty maximum<input name="maxScore" type="number" step="0.5" defaultValue={20} /></label>
        <label>Coefficient<input name="coefficient" type="number" step="0.5" defaultValue={1} /></label>
        <label>Daty<input name="date" type="date" required /></label>
        <button>Hamorona</button>
      </form>
    </>
  );
}
