import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { weekRange } from "@/lib/dates";

export default async function Dashboard() {
  const u = await requireUser();
  const { start, end } = weekRange();

  const notifs = await prisma.notification.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = isStaff(u.role)
    ? [
        { label: "Élèves", value: await prisma.student.count() },
        { label: "Enseignants", value: await prisma.teacher.count() },
        {
          label: "Séances (semaine)",
          value: await prisma.session.count({
            where: { startsAt: { gte: start, lt: end } },
          }),
        },
        {
          label: "Absences élèves (semaine)",
          value: await prisma.studentAttendance.count({
            where: {
              status: "ABSENT",
              session: { startsAt: { gte: start, lt: end } },
            },
          }),
        },
      ]
    : null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Bonjour, {u.name}</h1>
          <p>Tableau de bord de l&apos;établissement</p>
        </div>
        {isStaff(u.role) && (
          <Link href="/students/new" className="btn">
            + Inscrire un élève
          </Link>
        )}
      </div>

      {stats && (
        <div className="grid">
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="label">{s.label}</div>
              <div className="value">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <h2>Notifications récentes</h2>
      {notifs.length === 0 && <p className="muted">Aucune notification.</p>}
      {notifs.map((n) => (
        <div key={n.id} className={`card ${n.readAt ? "" : "unread"}`}>
          <strong>{n.title}</strong>
          <div className="muted" style={{ marginTop: 4 }}>
            {n.body}
          </div>
        </div>
      ))}
      <Link href="/notifications" className="btn-ghost">
        Voir toutes les notifications →
      </Link>
    </>
  );
}
