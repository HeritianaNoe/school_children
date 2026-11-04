import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icons";
import { requireUser } from "@/lib/session";
import { updateReclamationStatus } from "@/app/actions/reclamations";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Ouverte",
  IN_PROGRESS: "En cours",
  CLOSED: "Clôturée",
};

export default async function ReclamationsPage() {
  const u = await requireUser();
  const staff = u.role === "ADMIN" || u.role === "DIRECTOR" || u.role === "MANAGER";

  const list = await prisma.reclamation.findMany({
    where: staff ? undefined : { authorId: u.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, email: true } } },
    take: 100,
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Réclamations</h1>
          <p>
            {staff
              ? "Toutes les réclamations des utilisateurs"
              : "Vos réclamations adressées à l'administration"}
          </p>
        </div>
        <Link href="/reclamations/new" className="btn">
          <Icon name="plus" size={16} />
          Nouvelle réclamation
        </Link>
      </div>

      <h2 style={{ marginTop: 8 }}>Liste</h2>
      {list.length === 0 && <p className="muted">Aucune réclamation.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((r) => {
          const isMine = r.authorId === u.id;
          return (
            <div key={r.id} className="card">
              {/* Mpandefa / auteur en haut de l'objet */}
              <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>
                <strong style={{ color: "var(--text)" }}>
                  {isMine ? "Vous" : r.author.name}
                </strong>
                {" · "}
                {r.author.email}
                {" · "}
                {r.createdAt.toLocaleString("fr-FR")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong style={{ fontSize: "1.02rem" }}>{r.subject}</strong>
                  <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{r.body}</div>
                  {r.response && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        background: "var(--success-soft)",
                        borderRadius: 8,
                        fontSize: "0.9rem",
                      }}
                    >
                      <strong>Réponse de l&apos;administration :</strong> {r.response}
                    </div>
                  )}
                </div>
                <div>
                  <span
                    className={`tag ${
                      r.status === "CLOSED"
                        ? "tag-muted"
                        : r.status === "IN_PROGRESS"
                          ? "LATE"
                          : "tag-success"
                    }`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </div>

              {staff && (
                <form
                  action={updateReclamationStatus.bind(null, r.id)}
                  className="row"
                  style={{ marginTop: 12, gap: 8, alignItems: "flex-end" }}
                >
                  <label style={{ margin: 0 }}>
                    Statut
                    <select name="status" defaultValue={r.status} style={{ fontSize: "0.85rem" }}>
                      <option value="OPEN">Ouverte</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="CLOSED">Clôturée</option>
                    </select>
                  </label>
                  <label style={{ flex: 1, margin: 0, minWidth: 160 }}>
                    Réponse
                    <input
                      name="response"
                      defaultValue={r.response ?? ""}
                      placeholder="Réponse (optionnel)"
                      style={{ fontSize: "0.85rem" }}
                    />
                  </label>
                  <button type="submit" className="btn-sm btn-secondary">
                    <Icon name="save" size={16} />
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
