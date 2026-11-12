import Link from "next/link";
import AppearancePicker from "@/components/AppearancePicker";
import Icon from "@/components/Icons";
import { requireUser } from "@/lib/session";
import { ROLES, hasRole } from "@/lib/permissions";
import { updateMaxStudents } from "@/app/actions/settings";
import { getMaxStudentsPerClass, MAX_STUDENTS_LIMITS } from "@/lib/settings";
import { getOverCapacityClasses } from "@/lib/capacity";
import { ALERT_LIMITS } from "@/lib/student-alerts";

export default async function SettingsPage() {
  const u = await requireUser();
  const staff = hasRole(u.role, ROLES.STAFF);
  const canEdit = hasRole(u.role, ROLES.DIRECTION);
  const [max, over] = staff ? await Promise.all([getMaxStudentsPerClass(), getOverCapacityClasses()]) : [0, []];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Paramètres</h1>
          <p>Personnalisez l&apos;application et réglez le fonctionnement de l&apos;établissement</p>
        </div>
      </div>

      <section className="settings-section">
        <h2 style={{ marginTop: 0 }}>Apparence</h2>
        <p className="muted settings-lead">
          Choisissez les couleurs du menu et des boutons. Le choix s&apos;applique immédiatement et reste mémorisé sur cet
          appareil.
        </p>
        <AppearancePicker />
      </section>

      {staff && (
        <section className="settings-section">
          <h2>Effectif maximum par classe</h2>
          <p className="muted settings-lead">
            Quand une classe de l&apos;année scolaire courante dépasse ce nombre d&apos;élèves, un badge rouge apparaît sur la
            cloche, à côté du bouton « Se déconnecter ». Les inscriptions restent possibles : c&apos;est une alerte, pas
            un blocage.
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

          <h3 style={{ margin: "26px 0 12px", fontSize: "1rem" }}>Classes au-dessus du maximum</h3>
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
          <h3 style={{ margin: "26px 0 8px", fontSize: "1rem" }}>Autres alertes de la cloche</h3>
          <ul className="muted" style={{ paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Élèves ayant une note inférieure à {ALERT_LIMITS.LOW_GRADE_BELOW} / 20 (année scolaire courante).</li>
            <li>
              Élèves absents plus de {ALERT_LIMITS.ABSENT_DAYS_OVER} jours sur les {ALERT_LIMITS.ABSENT_WINDOW_DAYS} derniers
              jours.
            </li>
          </ul>
        </section>
      )}
    </>
  );
}
