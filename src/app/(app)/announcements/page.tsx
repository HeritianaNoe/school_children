import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icons";
import { requireUser } from "@/lib/session";
import { createAnnouncement, deleteAnnouncement } from "@/app/actions/announcements";
import ConfirmButton from "@/components/ConfirmButton";

export default async function AnnouncementsPage() {
  const u = await requireUser();
  const staff = u.role === "ADMIN" || u.role === "DIRECTOR" || u.role === "MANAGER";

  const list = await prisma.announcement.findMany({
    where: staff ? undefined : { published: true },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, email: true } } },
    take: 50,
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Annonces</h1>
          <p>Messages et informations de l&apos;établissement</p>
        </div>
      </div>

      {staff && (
        <div className="card form-section" style={{ maxWidth: 640 }}>
          <h3>Nouvelle annonce</h3>
          <p className="muted" style={{ marginBottom: 12, fontSize: "0.88rem" }}>
            Publiée par : <strong>{u.name}</strong> (compte connecté)
          </p>
          <form action={createAnnouncement} className="stack">
            <label>
              Titre
              <input name="title" required maxLength={200} placeholder="Ex. Réunion parents-professeurs" />
            </label>
            <label>
              Contenu
              <textarea name="body" required rows={5} maxLength={4000} placeholder="Texte de l'annonce…" />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
              <input name="published" type="checkbox" defaultChecked />
              Publier immédiatement
            </label>
            <div className="form-actions">
              <button type="submit">Publier l&apos;annonce</button>
            </div>
          </form>
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>Annonces récentes</h2>
      {list.length === 0 && <p className="muted">Aucune annonce pour le moment.</p>}
      {list.map((a) => {
        const isMine = a.authorId === u.id;
        return (
          <div key={a.id} className="card">
            {/* Mpandefa / auteur en haut */}
            <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>
              <strong style={{ color: "var(--text)" }}>
                {isMine ? "Vous" : a.author.name}
              </strong>
              {" · "}
              {a.author.email}
              {" · "}
              {a.createdAt.toLocaleString("fr-FR")}
              {!a.published && (
                <span className="tag tag-muted" style={{ marginLeft: 8 }}>
                  Brouillon
                </span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "1.08rem" }}>{a.title}</strong>
                <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{a.body}</div>
              </div>
              {staff && (
                <form action={deleteAnnouncement.bind(null, a.id)}>
                  <ConfirmButton
                    message={`Supprimer l'annonce « ${a.title} » ?`}
                    className="btn-ghost btn-sm"
                    title="Supprimer"
                  >
                    <Icon name="trash" size={16} />
                  </ConfirmButton>
                </form>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
