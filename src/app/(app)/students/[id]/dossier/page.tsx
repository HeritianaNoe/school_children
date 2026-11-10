import Link from "next/link";
import { notFound } from "next/navigation";
import { studentImageUrl } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { loadDossier } from "@/lib/dossier";
import { addComment } from "@/app/actions/comments";
import { fmtDate } from "@/lib/format";
import { NOMENCLATURE_LABEL } from "@/lib/labels";
import { forbidden } from "@/lib/flash";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";
import PdfLink from "@/components/PdfLink";
import AddDialog from "@/components/AddDialog";

/** Dossier d'élève : présences (30 derniers jours), moyennes, notes et commentaires. */
export default async function StudentDossierPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const u = await requireUser();
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { classe: { include: { schoolYear: true } } },
  });
  if (!s) notFound();
  if (u.role === "STUDENT" && s.userId !== u.id) forbidden();
  const staffView = u.role !== "STUDENT";
  const canComment = u.role === "ADMIN" || u.role === "DIRECTOR" || u.role === "TEACHER";

  const { attendance, averages, grades: allGrades, comments } = await loadDossier(s.id, staffView);
  const { items: grades, page, totalPages, total } = paginate(allGrades, searchParams.page);
  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={studentImageUrl(s)} alt="" className="photo-preview" style={{ width: 72, height: 86 }} />
          <div>
            <h1>Dossier d&apos;élève</h1>
            <p>
              {s.lastName.toUpperCase()} {s.firstName} · {s.matricule} · {s.classe.name} ({s.classe.schoolYear.name}) ·{" "}
              {NOMENCLATURE_LABEL[s.nomenclature]}
            </p>
          </div>
        </div>
        <Link href={`/students/${s.id}`} className="btn-secondary btn">
          ← Retour à l&apos;élève
        </Link>
      </div>

      <h2 style={{ marginTop: 0 }}>Présence (30 derniers jours)</h2>
      <div className="grid">
        <div className="stat-card">
          <div className="label">Présences</div>
          <div className="value">{attendance.present}</div>
        </div>
        <div className="stat-card">
          <div className="label">Retards</div>
          <div className="value">{attendance.late}</div>
        </div>
        <div className="stat-card">
          <div className="label">Absences</div>
          <div className="value">{attendance.absent}</div>
        </div>
        <div className="stat-card">
          <div className="label">Absences justifiées</div>
          <div className="value">{attendance.excused}</div>
        </div>
      </div>

      <h2>Moyennes</h2>
      <div className="grid">
        {averages.map(({ t, avg }) => (
          <div className="stat-card" key={t.id}>
            <div className="label">{t.name}</div>
            <div className="value">
              {avg ?? "—"}
              {avg != null && <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>/20</span>}
            </div>
          </div>
        ))}
        {averages.length === 0 && <p className="muted">Aucune période définie.</p>}
      </div>

      <h2>Notes</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Matière</th>
              <th>Évaluation</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id}>
                <td>{fmtDate(g.assessment.date)}</td>
                <td>{g.assessment.course.subject.name}</td>
                <td>{g.assessment.title}</td>
                <td>
                  {g.score ?? "Abs."} / {g.assessment.maxScore}
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  Aucune note enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TableFooter path={`/students/${s.id}/dossier`} page={page} totalPages={totalPages} total={total} />

      {staffView && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "32px 0 14px" }}>
            <h2 style={{ margin: 0 }}>Commentaires</h2>
            {canComment && (
              <AddDialog label="Ajouter un commentaire" title="Ajouter un commentaire" maxWidth={520}>
                <form action={addComment}>
                  <input type="hidden" name="studentId" value={s.id} />
                  <label>
                    Commentaire *
                    <textarea name="body" rows={5} required maxLength={2000} placeholder="Saisir un commentaire…" />
                  </label>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" data-dialog-close>
                      Annuler
                    </button>
                    <button type="submit">Ajouter</button>
                  </div>
                </form>
              </AddDialog>
            )}
          </div>
          {comments.map((c) => (
            <div className="card" key={c.id}>
              <div className="muted">
                {c.author.name} · {c.createdAt.toLocaleString("fr-FR")}
              </div>
              <div style={{ marginTop: 6 }}>{c.body}</div>
            </div>
          ))}
          {comments.length === 0 && <p className="muted">Aucun commentaire.</p>}
        </>
      )}

      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}>
        <PdfLink href={`/api/students/${s.id}/dossier`} title="Télécharger le dossier complet en PDF" />
      </div>
    </>
  );
}
