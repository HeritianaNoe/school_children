import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createAnnouncement } from "@/app/actions/announcements";

export default async function NewAnnouncementPage() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvelle annonce</h1>
          <p>
            Publiée par : <strong>{u.name}</strong> (compte connecté)
          </p>
        </div>
        <Link href="/announcements" className="btn-secondary btn">
          ← Retour aux annonces
        </Link>
      </div>

      <form action={createAnnouncement} className="form-section" style={{ maxWidth: 640 }}>
        <div className="stack">
          <label>
            Titre
            <input name="title" required minLength={3} maxLength={200} placeholder="Ex. Réunion parents-professeurs" />
          </label>
          <label>
            Contenu
            <textarea name="body" required minLength={5} rows={6} maxLength={4000} placeholder="Texte de l'annonce…" />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
            <input name="published" type="checkbox" defaultChecked style={{ width: "auto" }} />
            Publier immédiatement
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Publier l&apos;annonce</button>
          <Link href="/announcements" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
