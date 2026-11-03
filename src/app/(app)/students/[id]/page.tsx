import Link from "next/link";
import { studentImageUrl } from "@/lib/avatar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { studentAverage } from "@/lib/grades";
import { addComment } from "@/app/actions/comments";
import { deleteStudent } from "@/app/actions/students";
import { fmtDate, fmtDateFull } from "@/lib/format";
import { SEX_LABEL } from "@/lib/labels";
import { forbidden } from "@/lib/flash";
import ConfirmButton from "@/components/ConfirmButton";

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const u = await requireUser();
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, classe: true },
  });
  if (!s) notFound();
  if (u.role === "STUDENT" && s.userId !== u.id) forbidden();
  const staffView = u.role !== "STUDENT";
  const canManage = u.role === "ADMIN" || u.role === "DIRECTOR";

  const since = new Date(Date.now() - 30 * 86400_000);
  const att = await prisma.studentAttendance.groupBy({
    by: ["status"],
    where: { studentId: s.id, session: { startsAt: { gte: since } } },
    _count: { _all: true },
  });
  const count = (k: string) => att.find((a) => a.status === k)?._count._all ?? 0;

  const terms = await prisma.term.findMany({ orderBy: { startDate: "asc" } });
  const averages = await Promise.all(
    terms.map(async (t) => ({ t, avg: await studentAverage(s.id, t.id) }))
  );
  const grades = await prisma.grade.findMany({
    where: { studentId: s.id },
    orderBy: { assessment: { date: "desc" } },
    take: 20,
    include: { assessment: { include: { course: { include: { subject: true } } } } },
  });
  const comments = staffView
    ? await prisma.comment.findMany({
        where: { studentId: s.id },
        orderBy: { createdAt: "desc" },
        include: { author: true },
      })
    : [];

  const sexLabel = s.sex ? SEX_LABEL[s.sex] : "—";

  return (
    <>
      {searchParams.created && (
        <div className="card" style={{ background: "#d1fae5", borderColor: "#6ee7b7", marginBottom: 16 }}>
          Élève inscrit avec succès. Matricule attribué : <strong>{s.matricule}</strong>.{" "}
          <Link href={`/students/${s.id}/fiche`}>Imprimer la fiche d&apos;inscription →</Link>
        </div>
      )}

      <div className="page-header">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={studentImageUrl(s)} alt="" className="photo-preview" style={{ width: 72, height: 86 }} />
          <div>
            <h1>
              {s.lastName.toUpperCase()} {s.firstName}
            </h1>
            <p>
              {s.matricule} · {s.classe.name} ({s.classe.year}) · {sexLabel}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {staffView && (
            <Link href={`/students/${s.id}/fiche`} className="btn">
              Fiche d&apos;inscription
            </Link>
          )}
          <Link href={`/students/${s.id}/notes`} className="btn-secondary btn">
            Notes par matière
          </Link>
          <Link href={`/students/${s.id}/bulletin`} className="btn-secondary btn">
            Bulletin
          </Link>
          {canManage && (
            <Link href={`/students/${s.id}/edit`} className="btn-secondary btn">
              Modifier
            </Link>
          )}
          {staffView && (
            <Link href="/students" className="btn-secondary btn">
              Liste des élèves
            </Link>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>Informations personnelles</h3>
        <div className="form-grid">
          <div>
            <span className="muted">Date de naissance</span>
            <div>{fmtDateFull(s.birthDate)}</div>
          </div>
          <div>
            <span className="muted">Lieu de naissance</span>
            <div>{s.birthPlace || "—"}</div>
          </div>
          <div>
            <span className="muted">Adresse</span>
            <div>{s.address || "—"}</div>
          </div>
          <div>
            <span className="muted">Téléphone</span>
            <div>{s.phone || "—"}</div>
          </div>
          <div>
            <span className="muted">Parent / Tuteur</span>
            <div>{s.parentName || "—"}</div>
          </div>
          <div>
            <span className="muted">Téléphone du parent</span>
            <div>{s.parentPhone || "—"}</div>
          </div>
          <div>
            <span className="muted">Date d&apos;inscription</span>
            <div>{fmtDateFull(s.registeredAt)}</div>
          </div>
          <div>
            <span className="muted">Compte de connexion</span>
            <div>{s.user.email}</div>
          </div>
        </div>
      </div>

      <h2>Présence (30 derniers jours)</h2>
      <div className="grid">
        <div className="stat-card">
          <div className="label">Présences</div>
          <div className="value">{count("PRESENT")}</div>
        </div>
        <div className="stat-card">
          <div className="label">Retards</div>
          <div className="value">{count("LATE")}</div>
        </div>
        <div className="stat-card">
          <div className="label">Absences</div>
          <div className="value">{count("ABSENT")}</div>
        </div>
        <div className="stat-card">
          <div className="label">Absences justifiées</div>
          <div className="value">{count("EXCUSED")}</div>
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

      <h2>Notes récentes</h2>
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

      {staffView && (
        <>
          <h2>Commentaires</h2>
          <form action={addComment} className="form-section">
            <input type="hidden" name="studentId" value={s.id} />
            <label>
              Nouveau commentaire
              <textarea name="body" rows={3} required placeholder="Saisir un commentaire…" />
            </label>
            <div className="form-actions" style={{ border: 0, paddingTop: 0, marginTop: 12 }}>
              <button type="submit">Ajouter</button>
            </div>
          </form>
          {comments.map((c) => (
            <div className="card" key={c.id}>
              <div className="muted">
                {c.author.name} · {c.createdAt.toLocaleString("fr-FR")}
              </div>
              <div style={{ marginTop: 6 }}>{c.body}</div>
            </div>
          ))}
        </>
      )}

      {canManage && (
        <div className="card danger-zone" style={{ marginTop: 32 }}>
          <strong>Supprimer ce dossier</strong>
          <p className="muted" style={{ margin: "6px 0 12px" }}>
            Supprime l&apos;élève, son compte, ses notes, ses présences et ses commentaires. Cette action est définitive.
          </p>
          <form action={deleteStudent}>
            <input type="hidden" name="id" value={s.id} />
            <ConfirmButton
              message={`Supprimer définitivement le dossier de ${s.firstName} ${s.lastName} (${s.matricule}) ? Cette action est irréversible.`}
            >
              Supprimer l&apos;élève
            </ConfirmButton>
          </form>
        </div>
      )}
    </>
  );
}
