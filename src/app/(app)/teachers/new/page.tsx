import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createTeacher } from "@/app/actions/teachers";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import PhotoInput from "@/components/PhotoInput";

export default async function NewTeacherPage() {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvel enseignant</h1>
          <p>Créer le compte utilisateur et la fiche enseignant (lié aux Utilisateurs).</p>
        </div>
        <Link href="/teachers" className="btn-secondary btn">
          ← Retour à la liste
        </Link>
      </div>

      <form action={createTeacher} className="form-section" style={{ maxWidth: 560 }}>
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
            Numéro de téléphone
            <input name="phone" type="tel" maxLength={40} placeholder="+261 34 00 000 00" />
          </label>
          <PhotoInput label="Photo de l'enseignant" />
          <label>
            Taux horaire (Ar)
            <input name="hourlyRate" type="number" min={0} step={100} defaultValue={8000} required />
          </label>
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
          L&apos;enseignant pourra le changer depuis « Modifier mon compte ».
        </p>

        <div className="form-actions">
          <button type="submit">Créer l&apos;enseignant</button>
          <Link href="/teachers" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
