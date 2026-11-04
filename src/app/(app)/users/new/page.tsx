import Link from "next/link";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/labels";
import { createUser } from "@/app/actions/users";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import PhotoInput from "@/components/PhotoInput";

export default async function NewUserPage() {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  // Les enseignants et les élèves se créent depuis « Enseignants » et « Élèves »
  const roles = Object.entries(ROLE_LABEL).filter(([k]) => {
    if (!["ADMIN", "DIRECTOR", "MANAGER"].includes(k)) return false;
    if (k === "ADMIN" && me.role !== "ADMIN") return false;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvel utilisateur</h1>
          <p>Créer un compte Administrateur, Directeur ou Manager (mot de passe par défaut appliqué automatiquement).</p>
        </div>
        <Link href="/users" className="btn-secondary btn">
          ← Retour à la liste
        </Link>
      </div>

      <form action={createUser} className="form-section" style={{ maxWidth: 560 }}>
        <div className="stack">
          <label>
            Nom *
            <input name="lastName" required maxLength={80} placeholder="RAKOTO" />
          </label>
          <label>
            Prénom *
            <input name="firstName" required maxLength={80} placeholder="Jean" />
          </label>
          <label>
            Adresse e-mail
            <input name="email" type="email" required maxLength={160} placeholder="nom@ecole.mg" />
          </label>
          <label>
            Rôle
            <select name="role" required defaultValue="MANAGER">
              {roles.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Numéro de téléphone
            <input name="phone" type="tel" maxLength={40} placeholder="+261 34 00 000 00" />
          </label>
          <PhotoInput label="Photo de l'utilisateur" />
          <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
            <input name="active" type="checkbox" defaultChecked />
            Compte actif
          </label>
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          <label>
            Mot de passe par défaut (facultatif)
            <input
              name="password"
              type="text"
              minLength={8}
              maxLength={72}
              autoComplete="off"
              placeholder="8 caractères minimum"
            />
          </label>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: "0.88rem" }}>
          Si ce champ est vide, le mot de passe par défaut <code>{DEFAULT_PASSWORDS.STAFF}</code> est utilisé.
          L&apos;utilisateur pourra le changer depuis « Modifier mon compte ».
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
