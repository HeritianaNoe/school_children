import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createClasse } from "@/app/actions/classes";

function defaultYear() {
  // Année scolaire à partir de septembre (ex. nov. 2026 → 2026-2027)
  const d = new Date();
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

export default async function ClassesPage() {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
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
              <th></th>
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
                  <Link href={`/classes/${c.id}`} className="btn-ghost btn-sm" title="Gérer" aria-label="Gérer">
                    <Icon name="eye" size={16} />
                  </Link>
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
