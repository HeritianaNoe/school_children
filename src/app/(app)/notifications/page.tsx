import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { markRead, markAllRead } from "@/app/actions/notifications";

export default async function Notifications() {
  const u = await requireUser();
  const list = await prisma.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <h1>Notification</h1>
      <form action={markAllRead}><button>Marihina ho voavaky rehetra</button></form>
      <br />
      {list.length === 0 && <p className="muted">Tsy misy.</p>}
      {list.map((n) => (
        <div key={n.id} className={`card ${n.readAt ? "" : "unread"}`}>
          <strong>{n.title}</strong>
          <div>{n.body}</div>
          <div className="muted">{n.createdAt.toLocaleString("fr-FR")}</div>
          {!n.readAt && (
            <form action={markRead}><input type="hidden" name="id" value={n.id} /><button className="link">Voavaky</button></form>
          )}
        </div>
      ))}
    </>
  );
}
