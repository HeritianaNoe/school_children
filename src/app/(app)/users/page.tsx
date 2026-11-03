import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/labels";
import { deleteUser, toggleUserActive } from "@/app/actions/users";
import ConfirmButton from "@/components/ConfirmButton";

const PAGE_SIZE = 15;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; page?: string };
}) {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const q = (searchParams.q ?? "").trim();
  const role = searchParams.role ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

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

  const [total, list] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        student: { select: { id: true, matricule: true } },
        teacher: { select: { id: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `?${s}` : "";
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
              <th>E-mail</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Liens</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              list.map((u) => (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td>
                    {u.active ? (
                      <span className="tag tag-success">Actif</span>
                    ) : (
                      <span className="tag tag-muted">Inactif</span>
                    )}
                  </td>
                  <td className="muted" style={{ fontSize: "0.85rem" }}>
                    {u.student && (
                      <Link href={`/students/${u.student.id}`}>Élève {u.student.matricule}</Link>
                    )}
                    {u.teacher && <span>Enseignant</span>}
                    {!u.student && !u.teacher && "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <Link href={`/users/${u.id}/edit`} className="btn-ghost btn-sm" title="Modifier" aria-label="Modifier">
                        <Icon name="pencil" size={16} />
                      </Link>
                      <form action={toggleUserActive.bind(null, u.id)}>
                        <button type="submit" className="btn-ghost btn-sm" title={u.active ? "Désactiver" : "Activer"}>
                          <Icon name={u.active ? "lock" : "unlock"} size={16} />
                        </button>
                      </form>
                      {!u.student && !u.teacher && (
                        <form action={deleteUser.bind(null, u.id)}>
                          <ConfirmButton
                            message={`Supprimer le compte de ${u.name} ?`}
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

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 ? (
            <Link href={`/users${qs(page - 1)}`} className="btn-secondary btn btn-sm">
              ← Précédent
            </Link>
          ) : (
            <span className="btn-secondary btn btn-sm" style={{ opacity: 0.4, pointerEvents: "none" }}>
              ← Précédent
            </span>
          )}
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/users${qs(page + 1)}`} className="btn-secondary btn btn-sm">
              Suivant →
            </Link>
          ) : (
            <span className="btn-secondary btn btn-sm" style={{ opacity: 0.4, pointerEvents: "none" }}>
              Suivant →
            </span>
          )}
        </div>
      )}
    </>
  );
}
