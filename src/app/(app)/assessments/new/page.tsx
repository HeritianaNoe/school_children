import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createAssessment } from "@/app/actions/grades";
import { toDateInput } from "@/lib/format";
import { ASSESSMENT_TYPE_LABEL } from "@/lib/labels";

export default async function NewAssessmentPage() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const courses = await prisma.course.findMany({
    where: u.role === "TEACHER" ? { teacher: { userId: u.id } } : {},
    include: { classe: { include: { schoolYear: true } }, subject: true },
    orderBy: [{ classe: { name: "asc" } }, { subject: { name: "asc" } }],
  });
  const terms = await prisma.term.findMany({
    include: { schoolYear: true },
    orderBy: [{ schoolYear: { startDate: "desc" } }, { startDate: "desc" }],
  });
  const ready = courses.length > 0 && terms.length > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvelle évaluation</h1>
          <p>Créer un devoir, une interrogation ou un examen</p>
        </div>
        <Link href="/assessments" className="btn-secondary btn">
          ← Retour
        </Link>
      </div>

      {!ready ? (
        <div className="card">
          <strong>Impossible de créer une évaluation pour le moment.</strong>
          <p className="muted" style={{ marginTop: 6 }}>
            {courses.length === 0
              ? "Aucune matière n'est associée à une classe (ou à vous) : associez d'abord des matières depuis la page d'une classe."
              : "Aucune période n'est définie : créez d'abord un trimestre ou un semestre dans « Périodes »."}
          </p>
        </div>
      ) : (
        <form action={createAssessment} className="form-section" style={{ maxWidth: 560 }}>
          <div className="form-grid">
            <label>
              Type *
              <select name="type" defaultValue="TEST">
                {Object.entries(ASSESSMENT_TYPE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Classe et matière *
              <select name="courseId" required>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.classe.name} ({c.classe.schoolYear.name}) · {c.subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Période *
              <select name="termId" required>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.schoolYear.name})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date *
              <input name="date" type="date" required defaultValue={toDateInput(new Date())} />
            </label>
            <label>
              Note maximale
              <input name="maxScore" type="number" step="0.5" min="0.5" defaultValue={20} />
            </label>
            <label>
              Coefficient
              <input name="coefficient" type="number" step="0.5" min="0.5" defaultValue={1} />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">Créer l&apos;évaluation</button>
            <Link href="/assessments" className="btn-secondary btn">
              Annuler
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
