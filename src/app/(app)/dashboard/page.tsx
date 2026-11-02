import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { weekRange } from "@/lib/dates";

export default async function Dashboard() {
  const u = await requireUser();
  const { start, end } = weekRange();
  const notifs = await prisma.notification.findMany({
    where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 5,
  });

  const stats = isStaff(u.role)
    ? {
        "Mpianatra": await prisma.student.count(),
        "Mpampianatra": await prisma.teacher.count(),
        "Séance (herinandro)": await prisma.session.count({ where: { startsAt: { gte: start, lt: end } } }),
        "Absence mpianatra (herinandro)": await prisma.studentAttendance.count({
          where: { status: "ABSENT", session: { startsAt: { gte: start, lt: end } } },
        }),
      }
    : null;

  return (
    <>
      <h1>Miarahaba, {u.name}</h1>
      {stats && (
        <div className="grid">
          {Object.entries(stats).map(([k, v]) => (
            <div className="card" key={k}><div className="muted">{k}</div><div style={{ fontSize: 28 }}>{v}</div></div>
          ))}
        </div>
      )}
      <h2>Notification vao haingana</h2>
      {notifs.length === 0 && <p className="muted">Tsy misy.</p>}
      {notifs.map((n) => (
        <div key={n.id} className={`card ${n.readAt ? "" : "unread"}`}>
          <strong>{n.title}</strong><div>{n.body}</div>
        </div>
      ))}
      <Link href="/notifications">Hijery rehetra →</Link>
    </>
  );
}
