"use client";

import { ACCESS_RESOURCES, STAFF_ROLES } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/labels";

type Props = {
  /** Map "ROLE:resource" → checked (déjà résolue avec les défauts) */
  matrix: Record<string, boolean>;
  canEdit: boolean;
  action: (fd: FormData) => void | Promise<void>;
};

export default function AccessMatrix({ matrix, canEdit, action }: Props) {
  return (
    <section id="access" className="settings-section">
      <h2 style={{ marginTop: 0 }}>Accès du personnel</h2>
      <p className="muted settings-lead">
        Cochez les modules autorisés pour chaque rôle.
        {canEdit
          ? " Seuls l'administrateur et le directeur peuvent modifier et enregistrer."
          : " Lecture seule — seuls l'administrateur et le directeur peuvent modifier."}
      </p>

      <form action={action}>
        <div className="table-wrap" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {STAFF_ROLES.map((role) => (
                  <th key={role} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                    {ROLE_LABEL[role] ?? role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACCESS_RESOURCES.map((res) => (
                <tr key={res.key}>
                  <td>
                    <strong>{res.label}</strong>
                  </td>
                  {STAFF_ROLES.map((role) => {
                    const locked = res.key === "access" && (role === "ADMIN" || role === "DIRECTOR");
                    const key = `${role}:${res.key}`;
                    const checked = locked || !!matrix[key];
                    const name = `access_${role}_${res.key}`;
                    return (
                      <td key={role} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          name={name}
                          value="on"
                          defaultChecked={checked}
                          disabled={!canEdit || locked}
                          aria-label={`${ROLE_LABEL[role]} — ${res.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button type="submit">Enregistrer les accès</button>
          </div>
        )}
      </form>
    </section>
  );
}
