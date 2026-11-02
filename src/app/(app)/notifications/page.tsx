import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { markAllRead } from "@/app/actions/notifications";

export default async function NotificationsPage() {
  const u = await requireUser();
  const list = await prisma.notification.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{list.filter((n) => !n.readAt).length} non lue(s)</p>
        </div>
        <form action={markAllRead}>
          <button type="submit" className="btn-secondary">
            Tout marquer comme lu
          </button>
        </form>
      </div>

      {list.length === 0 && <p className="muted">Aucune notification.</p>}
      {list.map((n) => (
        <div key={n.id} className={`card ${n.readAt ? "" : "unread"}`}>
          <strong>{n.title}</strong>
          <div style={{ marginTop: 4 }}>{n.body}</div>
          <div className="muted" style={{ marginTop: 6, fontSize: "0.8rem" }}>
            {n.createdAt.toLocaleString("fr-FR")}
          </div>
        </div>
      ))}
    </>
  );
}
