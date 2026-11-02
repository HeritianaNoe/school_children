import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/format";

export default async function SessionsPage() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const sessions = await prisma.session.findMany({
    where: u.role === "TEACHER" ? { teacher: { userId: u.id } } : {},
    orderBy: { startsAt: "desc" },
    take: 60,
    include: {
      course: { include: { classe: true, subject: true } },
      teacher: { include: { user: true } },
      teacherAttendance: true,
    },
  });

  const statusLabel: Record<string, string> = {
    PLANNED: "Planifiée",
    DONE: "Terminée",
    CANCELLED: "Annulée",
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Séances</h1>
          <p>Emploi du temps et présences</p>
        </div>
        {isStaff(u.role) && (
          <Link href="/sessions/new" className="btn">
            + Nouvelle séance
          </Link>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Horaires</th>
              <th>Classe</th>
              <th>Matière</th>
              <th>Enseignant</th>
              <th>Statut</th>
              <th>Présence prof</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{fmtDate(s.startsAt)}</td>
                <td>
                  {fmtTime(s.startsAt)} – {fmtTime(s.endsAt)}
                </td>
                <td>{s.course.classe.name}</td>
                <td>{s.course.subject.name}</td>
                <td>{s.teacher.user.name}</td>
                <td>
                  <span className={`tag ${s.status}`}>{statusLabel[s.status] ?? s.status}</span>
                </td>
                <td>
                  {s.teacherAttendance ? (
                    <span className={`tag ${s.teacherAttendance.status}`}>
                      {s.teacherAttendance.status}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <Link href={`/sessions/${s.id}`} className="btn-ghost btn-sm">
                    Détail
                  </Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={8} className="muted" style={{ textAlign: "center", padding: 28 }}>
                  Aucune séance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
