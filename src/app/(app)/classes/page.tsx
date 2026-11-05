import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createClasse, deleteClasse } from "@/app/actions/classes";
import ConfirmButton from "@/components/ConfirmButton";

export default async function ClassesPage() {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  // Les actions sur les classes sont réservées à l'administrateur et au directeur
  const canEdit = me.role === "ADMIN" || me.role === "DIRECTOR";
  const classes = await prisma.classe.findMany({
    include: { schoolYear: true, _count: { select: { students: true, courses: true } } },
    orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }],
  });
  const schoolYears = await prisma.schoolYear.findMany({ orderBy: { startDate: "desc" } });
  const defaultYearId = (schoolYears.find((y) => y.isCurrent) ?? schoolYears[0])?.id ?? "";

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Classes</h1>
          <p>Gestion des classes, de leurs matières et de leurs enseignants</p>
        </div>
      </div>

      {canEdit && (
        <form action={createClasse} className="form-section" style={{ maxWidth: 900 }}>
          <h3>Ajouter une classe</h3>
          {schoolYears.length === 0 ? (
            <p className="muted">
              Aucune année scolaire n&apos;existe encore. <Link href="/school-years">Créez-en une</Link> avant d&apos;ajouter une classe.
            </p>
          ) : (
            <div className="form-grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr 0.7fr auto", alignItems: "end" }}>
              <label>
                Nom de la classe *
                <input name="name" required maxLength={50} placeholder="Terminale C1" />
              </label>
              <label>
                Année scolaire *
                <select name="schoolYearId" required defaultValue={defaultYearId}>
                  {schoolYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                      {y.isCurrent ? " (courante)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Salle
                <input name="roomNumber" maxLength={20} placeholder="Salle 04" />
              </label>
              <label>
                Capacité
                <input name="capacity" type="number" min={1} max={500} defaultValue={40} />
              </label>
              <button type="submit">Ajouter</button>
            </div>
          )}
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Classe</th>
              <th>Année scolaire</th>
              <th>Salle</th>
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
                <td className="muted">{c.schoolYear.name}</td>
                <td className="muted">{c.roomNumber ?? "—"}</td>
                <td>
                  {c._count.students}
                  {c.capacity ? <span className="muted"> / {c.capacity}</span> : null}
                </td>
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
                            message={`Supprimer la classe ${c.name} (${c.schoolYear.name}) ? Cette action est irréversible.`}
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
                <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 28 }}>
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
