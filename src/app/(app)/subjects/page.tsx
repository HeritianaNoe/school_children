import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icons";
import { requireUser, isStaff } from "@/lib/session";
import { createSubject, deleteSubject } from "@/app/actions/subjects";
import ConfirmButton from "@/components/ConfirmButton";

export default async function SubjectsPage() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const canManage = isStaff(u.role);
  const subjects = await prisma.subject.findMany({
    include: { courses: { include: { classe: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Matières</h1>
          <p>{canManage ? "Création et gestion des matières enseignées" : "Matières enseignées dans l'établissement"}</p>
        </div>
      </div>

      {canManage && (
        <form action={createSubject} className="form-section" style={{ maxWidth: 640 }}>
          <h3>Ajouter une matière</h3>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr auto", alignItems: "end" }}>
            <label>
              Nom de la matière *
              <input name="name" required minLength={2} maxLength={80} placeholder="Mathématiques, Français…" />
            </label>
            <button type="submit">Ajouter</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Matière</th>
              <th>Classes concernées</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>
                  <strong>{subject.name}</strong>
                </td>
                <td className="muted">
                  {subject.courses.length > 0 ? subject.courses.map((c) => c.classe.name).join(", ") : "Aucune"}
                </td>
                {canManage && (
                  <td>
                    <div className="row">
                      <Link
                        href={`/subjects/${subject.id}/edit`}
                        className="btn-ghost btn-sm"
                        title="Modifier"
                        aria-label="Modifier"
                      >
                        <Icon name="pencil" size={16} />
                      </Link>
                      <form action={deleteSubject}>
                        <input type="hidden" name="id" value={subject.id} />
                        <ConfirmButton
                          message={`Supprimer la matière « ${subject.name} » ?`}
                          disabled={subject.courses.length > 0}
                          className="btn-ghost btn-sm"
                          title="Supprimer"
                        >
                          <Icon name="trash" size={16} />
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={canManage ? 3 : 2} className="muted" style={{ textAlign: "center", padding: 28 }}>
                  Aucune matière enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {canManage && (
        <p className="muted" style={{ marginTop: 6 }}>
          Une matière ne peut être supprimée que si elle n&apos;est associée à aucune classe. L&apos;association se fait
          depuis la page de chaque classe.
        </p>
      )}
    </>
  );
}
