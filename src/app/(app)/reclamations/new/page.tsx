import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createReclamation } from "@/app/actions/reclamations";

export default async function NewReclamationPage() {
  const u = await requireUser();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvelle réclamation</h1>
          <p>
            Envoyée par : <strong>{u.name}</strong> (compte connecté)
          </p>
        </div>
        <Link href="/reclamations" className="btn-secondary btn">
          ← Retour aux réclamations
        </Link>
      </div>

      <form action={createReclamation} className="form-section" style={{ maxWidth: 640 }}>
        <div className="stack">
          <label>
            Objet
            <input name="subject" required minLength={3} maxLength={200} placeholder="Ex. Problème de notes, absence…" />
          </label>
          <label>
            Message
            <textarea name="body" required minLength={5} rows={6} maxLength={4000} placeholder="Décrivez votre réclamation…" />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Envoyer la réclamation</button>
          <Link href="/reclamations" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
