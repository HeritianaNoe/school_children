import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icons";
import { requireUser } from "@/lib/session";
import { deleteAnnouncement } from "@/app/actions/announcements";
import ConfirmButton from "@/components/ConfirmButton";
import PrintCardButton from "@/components/PrintCardButton";

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
        {staff && (
          <Link href="/announcements/new" className="btn">
            <Icon name="plus" size={16} />
            Nouvelle annonce
          </Link>
        )}
      </div>

      <h2 style={{ marginTop: 8 }}>Annonces récentes</h2>
      {list.length === 0 && <p className="muted">Aucune annonce pour le moment.</p>}
      {list.map((a) => {
        const isMine = a.authorId === u.id;
        return (
          <div key={a.id} className="card">
            {/* Auteur / date */}
            <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 8 }}>
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

            {/* Titre + contenu */}
            <div style={{ marginBottom: 14 }}>
              <strong style={{ fontSize: "1.08rem", display: "block" }}>{a.title}</strong>
              <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{a.body}</div>
            </div>

            {/* Actions : PDF · Imprimer · Supprimer */}
            <div
              className="no-print"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                borderTop: "1px solid var(--border, #e5e7eb)",
                paddingTop: 12,
                marginTop: 4,
              }}
            >
              <a
                href={`/api/announcements/${a.id}/pdf`}
                className="btn btn-sm"
                title="Télécharger en PDF"
              >
                <Icon name="fileText" size={15} />
                PDF
              </a>
              <PrintCardButton label="Imprimer" className="btn btn-sm" />
              {staff && (
                <form action={deleteAnnouncement.bind(null, a.id)} style={{ marginLeft: "auto" }}>
                  <ConfirmButton
                    message={`Supprimer l'annonce « ${a.title} » ?`}
                    className="btn-ghost btn-sm"
                    title="Supprimer"
                  >
                    <Icon name="trash" size={16} />
                    Supprimer
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
