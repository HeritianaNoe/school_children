import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createAssessment } from "@/app/actions/grades";

export default async function NewAssessmentPage() {
  await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const courses = await prisma.course.findMany({
    include: { classe: true, subject: true },
    orderBy: { classe: { name: "asc" } },
  });
  const terms = await prisma.term.findMany({ orderBy: { startDate: "desc" } });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvelle évaluation</h1>
          <p>Créer un contrôle ou un devoir</p>
        </div>
        <Link href="/assessments" className="btn-secondary">
          ← Retour
        </Link>
      </div>

      <form action={createAssessment} className="form-section" style={{ maxWidth: 520 }}>
        <div className="form-grid">
          <label>
            Titre *
            <input name="title" required maxLength={120} placeholder="Interro 1, Dictée…" />
          </label>
          <label>
            Type
            <select name="type" defaultValue="TEST">
              <option value="HOMEWORK">Devoir</option>
              <option value="TEST">Interrogation</option>
              <option value="EXAM">Examen</option>
            </select>
          </label>
          <label>
            Cours *
            <select name="courseId" required>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.classe.name} · {c.subject.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Période *
            <select name="termId" required>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input name="date" type="date" required />
          </label>
          <label>
            Note maximale
            <input name="maxScore" type="number" step="0.5" defaultValue={20} />
          </label>
          <label>
            Coefficient
            <input name="coefficient" type="number" step="0.5" defaultValue={1} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Créer l&apos;évaluation</button>
        </div>
      </form>
    </>
  );
}
