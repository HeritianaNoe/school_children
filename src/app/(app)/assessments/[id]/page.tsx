import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { deleteAssessment } from "@/app/actions/grades";
import { fmtDateFull } from "@/lib/format";
import { ASSESSMENT_TYPE_LABEL } from "@/lib/labels";
import { forbidden } from "@/lib/flash";
import GradesForm from "@/components/GradesForm";
import ConfirmButton from "@/components/ConfirmButton";

export default async function AssessmentPage({ params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const a = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      term: true,
      course: {
        include: {
          subject: true,
          teacher: true,
          classe: {
            include: {
              schoolYear: true,
              students: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
            },
          },
        },
      },
      grades: true,
    },
  });
  if (!a) notFound();
  if (u.role === "TEACHER" && a.course.teacher.userId !== u.id) forbidden();

  const g = new Map(a.grades.map((x) => [x.studentId, x]));
  const rows = a.course.classe.students.map((s) => ({
    studentId: s.id,
    name: `${s.lastName.toUpperCase()} ${s.firstName}`,
    score: g.get(s.id)?.score ?? null,
    gradeId: g.get(s.id)?.id ?? null,
  }));

  const scored = a.grades.filter((x) => x.score !== null).map((x) => x.score as number);
  const avg = scored.length ? scored.reduce((s, v) => s + v, 0) / scored.length : null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{a.title}</h1>
          <p>
            {a.course.classe.name} ({a.course.classe.schoolYear.name}) · {a.course.subject.name} ·{" "}
            {ASSESSMENT_TYPE_LABEL[a.type] ?? a.type} · {a.term.name} · {fmtDateFull(a.date)} · coef. {a.coefficient}
          </p>
        </div>
        <div className="row">
          <Link href={`/assessments/${a.id}/edit`} className="btn-secondary btn">
            Modifier l&apos;évaluation
          </Link>
          <Link href="/assessments" className="btn-secondary btn">
            ← Retour
          </Link>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="label">Notes saisies</div>
          <div className="value">
            {scored.length}/{rows.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Moyenne de la classe</div>
          <div className="value">
            {avg === null ? "—" : avg.toFixed(2)}
            {avg !== null && <span style={{ fontSize: "0.9rem", fontWeight: 500 }}> /{a.maxScore}</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Meilleure / plus basse</div>
          <div className="value" style={{ fontSize: "1.3rem" }}>
            {scored.length ? `${Math.max(...scored)} / ${Math.min(...scored)}` : "—"}
          </div>
        </div>
      </div>

      <GradesForm assessmentId={a.id} maxScore={a.maxScore} rows={rows} />

      <div className="card danger-zone" style={{ marginTop: 32 }}>
        <strong>Supprimer l&apos;évaluation</strong>
        <p className="muted" style={{ margin: "6px 0 12px" }}>
          Supprime l&apos;évaluation et toutes les notes qui lui sont associées. Cette action est définitive.
        </p>
        <form action={deleteAssessment}>
          <input type="hidden" name="id" value={a.id} />
          <ConfirmButton message={`Supprimer l'évaluation « ${a.title} » et ses ${a.grades.length} note(s) ?`}>
            Supprimer l&apos;évaluation
          </ConfirmButton>
        </form>
      </div>
    </>
  );
}
