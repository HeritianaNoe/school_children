import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/format";
import { ATTENDANCE_LABEL, SESSION_STATUS_LABEL } from "@/lib/labels";

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

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Séances et présences</h1>
          <p>Emploi du temps, appel des élèves et présence des enseignants</p>
        </div>
        {isStaff(u.role) && (
          <Link href="/sessions/new" className="btn">
            <Icon name="plus" size={16} />
            Nouvelle séance
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
              <th>Présence de l'enseignant</th>
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
                  <span className={`tag ${s.status}`}>{SESSION_STATUS_LABEL[s.status] ?? s.status}</span>
                </td>
                <td>
                  {s.teacherAttendance ? (
                    <span className={`tag ${s.teacherAttendance.status}`}>
                      {ATTENDANCE_LABEL[s.teacherAttendance.status]}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <Link href={`/sessions/${s.id}`} className="btn-ghost btn-sm" title="Voir le détail" aria-label="Voir">
                    <Icon name="eye" size={16} />
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
