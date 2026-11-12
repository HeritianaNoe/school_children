import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/labels";
import { deleteUser, toggleUserActive } from "@/app/actions/users";
import ConfirmButton from "@/components/ConfirmButton";
import { userImageUrl } from "@/lib/avatar";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";

export default async function UsersPage({
  searchParams: searchParamsP,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const searchParams = await searchParamsP;
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const q = (searchParams.q ?? "").trim();
  const role = searchParams.role ?? "";

  const where = {
    ...(role ? { role: role as any } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const all = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      student: { select: { id: true, matricule: true, sex: true, photoUrl: true } },
      teacher: { select: { id: true } },
    },
  });
  const { items: list, page, totalPages, total } = paginate(all, searchParams.page);

  const pdf = {
    title: "Utilisateurs",
    subtitle: [
      `${total} compte${total > 1 ? "s" : ""}`,
      role ? `Rôle : ${(ROLE_LABEL as Record<string, string>)[role] ?? role}` : "",
      q ? `Recherche : ${q}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    headers: ["Nom", "E-mail", "Rôle", "Statut"],
    rows: all.map((u) => [
      u.name,
      u.email,
      ROLE_LABEL[u.role] ?? u.role,
      u.active ? "Actif" : "Inactif",
    ]),
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Utilisateurs</h1>
          <p>
            {total} compte{total > 1 ? "s" : ""}
            {q || role ? " trouvé" + (total > 1 ? "s" : "") : ""}
          </p>
        </div>
        <Link href="/users/new" className="btn">
          <Icon name="plus" size={16} />
          Nouvel utilisateur
        </Link>
      </div>

      <form method="get" className="filters">
        <label>
          Recherche
          <input name="q" defaultValue={q} placeholder="Nom ou e-mail" />
        </label>
        <label>
          Rôle
          <select name="role" defaultValue={role}>
            <option value="">Tous les rôles</option>
            {Object.entries(ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filtrer</button>
        {(q || role) && (
          <Link href="/users" className="btn-secondary btn">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  Aucun utilisateur trouvé.
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
                  <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td>
                    {u.active ? (
                      <span className="tag tag-success">Actif</span>
                    ) : (
                      <span className="tag tag-muted">Inactif</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <Link href={`/users/${u.id}`} className="btn-ghost btn-sm" title="Voir le détail" aria-label="Voir le détail">
                        <Icon name="eye" size={16} />
                      </Link>
                      <Link href={`/users/${u.id}/edit`} className="btn-ghost btn-sm" title="Modifier" aria-label="Modifier">
                        <Icon name="pencil" size={16} />
                      </Link>
                      <form action={toggleUserActive.bind(null, u.id)}>
                        <button type="submit" className="btn-ghost btn-sm" title={u.active ? "Désactiver" : "Activer"}>
                          <Icon name={u.active ? "lock" : "unlock"} size={16} />
                        </button>
                      </form>
                      {u.id !== me.id &&
                        (u.role !== "ADMIN" || me.role === "ADMIN") &&
                        // Élèves et enseignants : réservé à l'administrateur et au directeur (comme la page « Élèves »)
                        (!(u.student || u.teacher) || me.role !== "MANAGER") && (
                          <form action={deleteUser.bind(null, u.id)}>
                            <ConfirmButton
                              message={
                                u.student
                                  ? `Supprimer le compte de ${u.name} ? Son dossier d'élève, ses notes et ses présences seront aussi supprimés. Cette action est irréversible.`
                                  : u.teacher
                                    ? `Supprimer le compte de ${u.name} ? Sa fiche enseignant et ses fiches de paie seront aussi supprimées. Cette action est irréversible.`
                                    : `Supprimer le compte de ${u.name} ? Cette action est irréversible.`
                              }
                              className="btn-ghost btn-sm"
                              title="Supprimer"
                            >
                              <Icon name="trash" size={16} />
                            </ConfirmButton>
                          </form>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TableFooter path="/users" params={{ q, role }} page={page} totalPages={totalPages} total={total} pdf={pdf} />
    </>
  );
}
