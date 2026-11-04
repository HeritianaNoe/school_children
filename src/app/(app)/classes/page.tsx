import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createClasse, deleteClasse } from "@/app/actions/classes";
import ConfirmButton from "@/components/ConfirmButton";

function defaultYear() {
  // Année scolaire à partir de septembre (ex. nov. 2026 → 2026-2027)
  const d = new Date();
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

export default async function ClassesPage() {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  // Les actions sur les classes sont réservées à l'administrateur et au directeur
  const canEdit = me.role === "ADMIN" || me.role === "DIRECTOR";
  const classes = await prisma.classe.findMany({
    include: { _count: { select: { students: true, courses: true } } },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Classes</h1>
          <p>Gestion des classes, de leurs matières et de leurs enseignants</p>
        </div>
      </div>

      <form action={createClasse} className="form-section" style={{ maxWidth: 640 }}>
        <h3>Ajouter une classe</h3>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr auto", alignItems: "end" }}>
          <label>
            Nom de la classe *
            <input name="name" required maxLength={60} placeholder="6ème A" />
          </label>
          <label>
            Année scolaire *
            <input
              name="year"
              required
              pattern="\d{4}-\d{4}"
              title="Format attendu : 2026-2027"
              defaultValue={defaultYear()}
              placeholder="2026-2027"
            />
          </label>
          <button type="submit">Ajouter</button>
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Classe</th>
              <th>Année scolaire</th>
              <th>Élèves</th>
              <th>Matières</th>
              <th style={{ width: 130 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td className="muted">{c.year}</td>
                <td>{c._count.students}</td>
                <td>{c._count.courses}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Link href={`/classes/${c.id}`} className="btn-ghost btn-sm" title="Gérer" aria-label="Gérer">
                      <Icon name="eye" size={16} />
                    </Link>
                    {canEdit && (
                      <>
                        <Link
                          href={`/classes/${c.id}/edit`}
                          className="btn-ghost btn-sm"
                          title="Modifier"
                          aria-label="Modifier"
                        >
                          <Icon name="pencil" size={16} />
                        </Link>
                        <form action={deleteClasse}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="from" value="list" />
                          <ConfirmButton
                            message={`Supprimer la classe ${c.name} (${c.year}) ? Cette action est irréversible.`}
                            className="btn-ghost btn-sm"
                            title="Supprimer"
                            disabled={c._count.students > 0}
                          >
                            <Icon name="trash" size={16} />
                          </ConfirmButton>
                        </form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center", padding: 28 }}>
                  Aucune classe enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
