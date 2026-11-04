import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/format";
import { SESSION_STATUS_LABEL } from "@/lib/labels";
import { deleteSession } from "@/app/actions/sessions";
import ConfirmButton from "@/components/ConfirmButton";

export default async function SessionsPage() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const canDelete = u.role === "ADMIN" || u.role === "DIRECTOR";
  const sessions = await prisma.session.findMany({
    where: u.role === "TEACHER" ? { teacher: { userId: u.id } } : {},
    orderBy: { startsAt: "desc" },
    take: 60,
    include: {
      course: { include: { classe: true, subject: true } },
      teacher: { include: { user: true } },
    },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Séances et présences</h1>
          <p>
            Séances issues de l&apos;<Link href="/timetable">emploi du temps</Link> · appel des élèves et présence des enseignants
          </p>
        </div>
        <div className="row">
          <Link href="/timetable" className="btn-secondary btn">
            <Icon name="calendar" size={16} />
            Emploi du temps
          </Link>
          {isStaff(u.role) && (
            <Link href="/sessions/new" className="btn">
              <Icon name="plus" size={16} />
              Nouvelle séance
            </Link>
          )}
        </div>
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
                  <div className="row">
                    <Link href={`/sessions/${s.id}`} className="btn-ghost btn-sm" title="Voir le détail" aria-label="Voir">
                      <Icon name="eye" size={16} />
                    </Link>
                    {canDelete && (
                      <form action={deleteSession}>
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmButton
                          message={`Supprimer la séance de ${s.course.subject.name} (${s.course.classe.name}) du ${fmtDate(s.startsAt)} ? Les présences enregistrées seront aussi supprimées.`}
                          className="btn-ghost btn-sm"
                          title="Supprimer"
                        >
                          <Icon name="trash" size={16} />
                        </ConfirmButton>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 28 }}>
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
