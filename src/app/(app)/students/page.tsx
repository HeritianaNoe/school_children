import Link from "next/link";
import { studentImageUrl } from "@/lib/avatar";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { SEX_LABEL } from "@/lib/labels";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; classe?: string };
}) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const q = (searchParams.q ?? "").trim();
  const classeId = searchParams.classe ?? "";

  const classes = await prisma.classe.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] });
  const list = await prisma.student.findMany({
    where: {
      ...(classeId ? { classeId } : {}),
      ...(q
        ? {
            OR: [
              { lastName: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { matricule: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { classe: true },
    orderBy: [{ classe: { name: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Élèves</h1>
          <p>
            {list.length} élève{list.length > 1 ? "s" : ""}
            {q || classeId ? " trouvé" + (list.length > 1 ? "s" : "") : ` inscrit${list.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {isStaff(u.role) && (
          <Link href="/students/new" className="btn">
            <Icon name="plus" size={16} />
            Nouvelle inscription
          </Link>
        )}
      </div>

      <form method="get" className="filters">
        <label>
          Recherche
          <input name="q" defaultValue={q} placeholder="Nom, prénom ou matricule" />
        </label>
        <label>
          Classe
          <select name="classe" defaultValue={classeId}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.year})
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filtrer</button>
        {(q || classeId) && (
          <Link href="/students" className="btn-secondary btn">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom et prénom</th>
              <th>Matricule</th>
              <th>Sexe</th>
              <th>Classe</th>
              <th>Parent / tuteur</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={studentImageUrl(s)} alt="" className="thumb" />
                    <span>
                      {s.lastName.toUpperCase()} {s.firstName}
                    </span>
                  </div>
                </td>
                <td>
                  <strong>{s.matricule}</strong>
                </td>
                <td>
                  {s.sex ? <span className={`tag ${s.sex}`}>{SEX_LABEL[s.sex]}</span> : "—"}
                </td>
                <td>{s.classe.name}</td>
                <td>
                  {s.parentName || "—"}
                  {s.parentPhone && (
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {s.parentPhone}
                    </div>
                  )}
                </td>
                <td>
                  <Link href={`/students/${s.id}`} className="btn-ghost btn-sm" title="Voir le dossier" aria-label="Voir le dossier">
                    <Icon name="eye" size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }} className="muted">
                  {q || classeId ? "Aucun élève ne correspond à votre recherche." : "Aucun élève inscrit pour le moment."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
