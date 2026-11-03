import Link from "next/link";
import { requireUser } from "@/lib/session";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";

export default async function CredentialsPage() {
  // Réservé à l'administration : ces mots de passe ne doivent pas être visibles des élèves.
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mots de passe par défaut</h1>
          <p>Informations à communiquer aux nouveaux utilisateurs.</p>
        </div>
        <Link href="/dashboard" className="btn-secondary btn">
          ← Tableau de bord
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h3>Important</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Les comptes élèves, enseignants et administrateurs utilisent un mot de passe initial défini par le système. Chaque
          utilisateur doit le modifier dès sa première connexion depuis « Modifier mon compte » dans le bas de la barre latérale.
        </p>

        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          <div className="card" style={{ padding: 18 }}>
            <strong>Élèves</strong>
            <div style={{ marginTop: 8 }}>
              Adresse e-mail : <code>prenom.nom@ecole.mg</code>
            </div>
            <div style={{ marginTop: 4 }}>
              Mot de passe par défaut : <code>{DEFAULT_PASSWORDS.STUDENT}</code>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <strong>Enseignants et administrateurs</strong>
            <div style={{ marginTop: 8 }}>
              Adresse e-mail : <code>nom@ecole.mg</code>
            </div>
            <div style={{ marginTop: 4 }}>
              Mot de passe par défaut : <code>{DEFAULT_PASSWORDS.STAFF}</code>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
