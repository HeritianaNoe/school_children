import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateAssessment } from "@/app/actions/grades";
import { toDateInput } from "@/lib/format";
import { ASSESSMENT_TYPE_LABEL } from "@/lib/labels";
import { forbidden } from "@/lib/flash";

export default async function EditAssessmentPage({ params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const a = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: { course: { include: { classe: { include: { schoolYear: true } }, subject: true, teacher: true } } },
  });
  if (!a) notFound();
  if (u.role === "TEACHER" && a.course.teacher.userId !== u.id) forbidden();
  const terms = await prisma.term.findMany({
    include: { schoolYear: true },
    orderBy: [{ schoolYear: { startDate: "desc" } }, { startDate: "desc" }],
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier l&apos;évaluation</h1>
          <p>
            {a.course.classe.name} ({a.course.classe.schoolYear.name}) · {a.course.subject.name}
          </p>
        </div>
        <Link href={`/assessments/${a.id}`} className="btn-secondary btn">
          ← Retour aux notes
        </Link>
      </div>

      <form action={updateAssessment} className="form-section" style={{ maxWidth: 560 }}>
        <input type="hidden" name="id" value={a.id} />
        <div className="form-grid">
          <label>
            Titre *
            <input name="title" required maxLength={120} defaultValue={a.title} />
          </label>
          <label>
            Type *
            <select name="type" defaultValue={a.type}>
              {Object.entries(ASSESSMENT_TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Période *
            <select name="termId" defaultValue={a.termId} required>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.schoolYear.name})
                </option>
              ))}
            </select>
          </label>
          <label>
            Date *
            <input name="date" type="date" required defaultValue={toDateInput(a.date)} />
          </label>
          <label>
            Note maximale
            <input name="maxScore" type="number" step="0.5" min="0.5" defaultValue={a.maxScore} />
          </label>
          <label>
            Coefficient
            <input name="coefficient" type="number" step="0.5" min="0.5" defaultValue={a.coefficient} />
          </label>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          La classe et la matière ne peuvent pas être modifiées : supprimez l&apos;évaluation et recréez-la si nécessaire.
        </p>
        <div className="form-actions">
          <button type="submit">Enregistrer les modifications</button>
          <Link href={`/assessments/${a.id}`} className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
