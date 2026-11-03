import Link from "next/link";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/labels";
import { createUser } from "@/app/actions/users";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";

export default async function NewUserPage() {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const roles = Object.entries(ROLE_LABEL).filter(([k]) => {
    if (k === "ADMIN" && me.role !== "ADMIN") return false;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvel utilisateur</h1>
          <p>Créer un compte (mot de passe par défaut appliqué automatiquement).</p>
        </div>
        <Link href="/users" className="btn-secondary btn">
          ← Retour à la liste
        </Link>
      </div>

      <form action={createUser} className="form-section" style={{ maxWidth: 520 }}>
        <div className="stack">
          <label>
            Nom complet
            <input name="name" required maxLength={120} placeholder="Ex. Rakoto Jean" />
          </label>
          <label>
            Adresse e-mail
            <input name="email" type="email" required maxLength={160} placeholder="nom@ecole.mg" />
          </label>
          <label>
            Rôle
            <select name="role" required defaultValue="TEACHER">
              {roles.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
            <input name="active" type="checkbox" defaultChecked />
            Compte actif
          </label>
        </div>

        <p className="muted" style={{ marginTop: 12, fontSize: "0.88rem" }}>
          Mot de passe initial : <code>{DEFAULT_PASSWORDS.STAFF}</code> (personnel) ou{" "}
          <code>{DEFAULT_PASSWORDS.STUDENT}</code> (élève). L&apos;utilisateur devra le changer
          depuis « Modifier mon compte ».
        </p>

        <div className="form-actions">
          <button type="submit">Créer le compte</button>
          <Link href="/users" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
