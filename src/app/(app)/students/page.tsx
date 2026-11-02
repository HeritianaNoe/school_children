import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function StudentsPage() {
  await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);

  const list = await prisma.student.findMany({
    include: { user: true, classe: true },
    orderBy: [{ classe: { name: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Élèves</h1>
          <p>{list.length} élève{list.length > 1 ? "s" : ""} inscrit{list.length > 1 ? "s" : ""}</p>
        </div>
        <Link href="/students/new" className="btn">
          + Nouvelle inscription
        </Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom et prénom</th>
              <th>Sexe</th>
              <th>Classe</th>
              <th>Année</th>
              <th>Parent / Tuteur</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.matricule}</strong>
                </td>
                <td>
                  {s.lastName.toUpperCase()} {s.firstName}
                </td>
                <td>
                  {s.sex ? (
                    <span className={`tag ${s.sex}`}>{s.sex === "M" ? "Garçon" : "Fille"}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{s.classe.name}</td>
                <td className="muted">{s.classe.year}</td>
                <td>
                  {s.parentName || "—"}
                  {s.parentPhone && (
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {s.parentPhone}
                    </div>
                  )}
                </td>
                <td>
                  <Link href={`/students/${s.id}`} className="btn-ghost btn-sm">
                    Fiche
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32 }} className="muted">
                  Aucun élève inscrit pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
