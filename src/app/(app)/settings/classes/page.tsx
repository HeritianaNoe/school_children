import Link from "next/link";
import { requireUser } from "@/lib/session";
import { ROLES, hasRole } from "@/lib/permissions";
import { updateMaxStudents } from "@/app/actions/settings";
import { getMaxStudentsPerClass, MAX_STUDENTS_LIMITS } from "@/lib/settings";
import { getOverCapacityClasses } from "@/lib/capacity";
import Icon from "@/components/Icons";

export default async function ClassSizeSettingsPage() {
  const u = await requireUser([...ROLES.STAFF]);
  const canEdit = hasRole(u.role, ROLES.DIRECTION);
  const [max, over] = await Promise.all([getMaxStudentsPerClass(), getOverCapacityClasses()]);

  return (
    <section className="settings-section">
      <h2 style={{ marginTop: 0 }}>Effectif maximum par classe</h2>
      <p className="muted settings-lead">
        Quand une classe de l&apos;année scolaire courante dépasse ce nombre d&apos;élèves, une cloche apparaît à côté du
        bouton « Se déconnecter ». Les inscriptions restent possibles : c&apos;est une alerte, pas un blocage.
      </p>

      <form action={updateMaxStudents} className="settings-form">
        <label>
          Nombre maximum d&apos;élèves par classe
          <input
            name="maxStudents"
            type="number"
            inputMode="numeric"
            min={MAX_STUDENTS_LIMITS.min}
            max={MAX_STUDENTS_LIMITS.max}
            defaultValue={max}
            required
            disabled={!canEdit}
          />
        </label>
        {canEdit ? (
          <button type="submit">Enregistrer</button>
        ) : (
          <span className="muted">Seuls l&apos;administrateur et le directeur peuvent modifier cette valeur.</span>
        )}
      </form>

      <h2>Classes au-dessus du maximum</h2>
      {over.length === 0 ? (
        <p className="settings-ok">
          <Icon name="check" size={16} /> Aucune classe ne dépasse {max} élève{max > 1 ? "s" : ""}.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Classe</th>
                <th>Année scolaire</th>
                <th>Élèves</th>
                <th>Dépassement</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {over.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td className="muted">{c.year}</td>
                  <td>
                    {c.count} <span className="muted">/ {c.max}</span>
                  </td>
                  <td>
                    <span className="tag" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                      +{c.count - c.max}
                    </span>
                  </td>
                  <td>
                    <Link href={`/classes/${c.id}`} className="btn-ghost btn-sm" title="Voir la classe" aria-label="Voir la classe">
                      <Icon name="eye" size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
