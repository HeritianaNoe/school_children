import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtAr } from "@/lib/format";
import { userImageUrl } from "@/lib/avatar";

export default async function TeachersPage() {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);

  // Tous les utilisateurs avec le rôle TEACHER (source de vérité = Utilisateurs)
  const teacherUsers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: { teacher: true },
    orderBy: { name: "asc" },
  });

  // Créer la fiche Teacher manquante pour les comptes TEACHER sans fiche
  for (const u of teacherUsers) {
    if (!u.teacher) {
      await prisma.teacher.create({
        data: { userId: u.id, hourlyRate: 0 },
      });
    }
  }

  // Recharger avec les fiches à jour
  const list = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: { teacher: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Enseignants</h1>
          <p>
            {list.length} enseignant{list.length > 1 ? "s" : ""} — même liste que les utilisateurs au rôle
            « Enseignant »
          </p>
        </div>
        <Link href="/teachers/new" className="btn">
          <Icon name="plus" size={16} />
          Nouvel enseignant
        </Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Adresse e-mail</th>
              <th>Taux horaire</th>
              <th>Statut</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  Aucun enseignant. Créez-en un ici ou ajoutez un utilisateur avec le rôle Enseignant.
                </td>
              </tr>
            ) : (
              list.map((u) => (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                  <td>
                    <div className="row">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={userImageUrl(u)} alt="" className="thumb" />
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td>{u.teacher ? fmtAr(Number(u.teacher.hourlyRate)) : "—"}</td>
                  <td>
                    {u.active ? (
                      <span className="tag tag-success">Actif</span>
                    ) : (
                      <span className="tag tag-muted">Inactif</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {u.teacher && (
                        <Link
                          href={`/teachers/${u.teacher.id}`}
                          className="btn-ghost btn-sm"
                          title="Voir la fiche"
                          aria-label="Voir la fiche"
                        >
                          <Icon name="eye" size={16} />
                        </Link>
                      )}
                      <Link
                        href={`/users/${u.id}/edit`}
                        className="btn-ghost btn-sm"
                        title="Modifier le compte"
                        aria-label="Modifier"
                      >
                        <Icon name="pencil" size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
