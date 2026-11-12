import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { userImageUrl } from "@/lib/avatar";
import { TEACHER_STATUS_LABEL, TEACHER_STATUS_VALUES } from "@/lib/labels";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";

export default async function TeachersPage({ searchParams: searchParamsP }: { searchParams: Promise<{ q?: string; statut?: string; page?: string }> }) {
  const searchParams = await searchParamsP;
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);

  const q = (searchParams.q ?? "").trim();
  const statut = (TEACHER_STATUS_VALUES as readonly string[]).includes(searchParams.statut ?? "")
    ? (searchParams.statut as (typeof TEACHER_STATUS_VALUES)[number])
    : "";

  const listQuery = {
    where: {
      role: "TEACHER" as const,
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ...(statut ? { teacher: { is: { status: statut } } } : {}),
    },
    include: { teacher: true },
    orderBy: { name: "asc" as const },
  };

  // Fiches Teacher manquantes (comptes TEACHER sans fiche) et liste lues en même temps
  const [missing, firstRead] = await Promise.all([
    prisma.user.findMany({ where: { role: "TEACHER", teacher: { is: null } }, select: { id: true } }),
    prisma.user.findMany(listQuery),
  ]);
  let all = firstRead;
  if (missing.length > 0) {
    await prisma.teacher.createMany({
      data: missing.map((u) => ({ userId: u.id, hourlyRate: 0 })),
      skipDuplicates: true,
    });
    all = await prisma.user.findMany(listQuery); // relecture seulement si des fiches viennent d'être créées
  }
  const { items: list, page, totalPages, total } = paginate(all, searchParams.page);
  const pdf = {
    title: "Enseignants",
    subtitle: [
      `${total} enseignant${total > 1 ? "s" : ""}`,
      statut ? `Statut : ${TEACHER_STATUS_LABEL[statut]}` : "",
      q ? `Recherche : ${q}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    headers: ["Nom", "Adresse e-mail", "Téléphone", "Statut", "Compte"],
    rows: all.map((u) => [
      u.name,
      u.email,
      u.phone || "—",
      u.teacher ? TEACHER_STATUS_LABEL[u.teacher.status] : "—",
      u.active ? "Actif" : "Inactif",
    ]),
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Enseignants</h1>
          <p>
            {total} enseignant{total > 1 ? "s" : ""} — même liste que les utilisateurs au rôle
            « Enseignant »
          </p>
        </div>
        <Link href="/teachers/new" className="btn">
          <Icon name="plus" size={16} />
          Nouvel enseignant
        </Link>
      </div>

      <form method="get" className="filters">
        <label>
          Recherche
          <input name="q" defaultValue={q} placeholder="Nom de l'enseignant" />
        </label>
        <label>
          Statut
          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            {TEACHER_STATUS_VALUES.map((v) => (
              <option key={v} value={v}>
                {TEACHER_STATUS_LABEL[v]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filtrer</button>
        {(q || statut) && (
          <Link href="/teachers" className="btn-secondary btn">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Adresse e-mail</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th>Compte</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  {q || statut ? "Aucun enseignant ne correspond à votre recherche." : "Aucun enseignant. Créez-en un ici ou ajoutez un utilisateur avec le rôle Enseignant."}
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
                  <td>{u.phone || "—"}</td>
                  <td>{u.teacher ? <span className="tag">{TEACHER_STATUS_LABEL[u.teacher.status]}</span> : "—"}</td>
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
      <TableFooter path="/teachers" params={{ q, statut }} page={page} totalPages={totalPages} total={total} pdf={pdf} />
    </>
  );
}
