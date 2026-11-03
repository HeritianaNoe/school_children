import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createTeacher } from "@/app/actions/teachers";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";

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

      <form action={createTeacher} className="form-section" style={{ maxWidth: 520 }}>
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
            Taux horaire (Ar)
            <input name="hourlyRate" type="number" min={0} step={100} defaultValue={8000} required />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
            <input name="active" type="checkbox" defaultChecked />
            Compte actif
          </label>
        </div>

        <p className="muted" style={{ marginTop: 12, fontSize: "0.88rem" }}>
          Mot de passe initial : <code>{DEFAULT_PASSWORDS.STAFF}</code>. L&apos;enseignant pourra le changer
          depuis « Modifier mon compte ».
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
