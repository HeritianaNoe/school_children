import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/format";
import { SESSION_STATUS_LABEL } from "@/lib/labels";
import { deleteSession } from "@/app/actions/sessions";
import ConfirmButton from "@/components/ConfirmButton";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: { classe?: string; teacher?: string; page?: string };
}) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const canDelete = u.role === "ADMIN" || u.role === "DIRECTOR";
  const isTeacher = u.role === "TEACHER";
  const classeId = searchParams.classe ?? "";
  const teacherId = isTeacher ? "" : searchParams.teacher ?? "";

  const where = {
    ...(isTeacher ? { teacher: { userId: u.id } } : {}),
    ...(classeId ? { course: { classeId } } : {}),
    ...(teacherId ? { teacherId } : {}),
  };

  const [classes, teachers, all] = await Promise.all([
    prisma.classe.findMany({
      include: { schoolYear: true },
      orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }],
    }),
    isTeacher
      ? Promise.resolve([])
      : prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
    prisma.session.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: {
        course: { include: { classe: true, subject: true } },
        teacher: { include: { user: true } },
      },
    }),
  ]);
  const { items: sessions, page, totalPages, total } = paginate(all, searchParams.page);

  const hasFilter = !!(classeId || teacherId);
  const classeName = classes.find((c) => c.id === classeId)?.name;
  const teacherName = teachers.find((t) => t.id === teacherId)?.user.name;
  const pdf = {
    title: "Séances et présences",
    subtitle: [
      `${total} séance${total > 1 ? "s" : ""}`,
      classeName ? `Classe : ${classeName}` : "",
      teacherName ? `Enseignant : ${teacherName}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    headers: ["Date", "Horaires", "Classe", "Matière", "Enseignant", "Statut"],
    rows: all.map((s) => [
      fmtDate(s.startsAt),
      `${fmtTime(s.startsAt)} – ${fmtTime(s.endsAt)}`,
      s.course.classe.name,
      s.course.subject.name,
      s.teacher.user.name,
      SESSION_STATUS_LABEL[s.status] ?? s.status,
    ]),
  };

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
        </div>
      </div>

      <form method="get" className="filters">
        <label>
          Classe
          <select name="classe" defaultValue={classeId}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.schoolYear.name})
              </option>
            ))}
          </select>
        </label>
        {!isTeacher && (
          <label>
            Enseignant
            <select name="teacher" defaultValue={teacherId}>
              <option value="">Tous les enseignants</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit">Filtrer</button>
        {hasFilter && (
          <Link href="/sessions" className="btn-secondary btn">
            Réinitialiser
          </Link>
        )}
      </form>

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
                  {hasFilter ? "Aucune séance ne correspond à ce filtre." : "Aucune séance."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TableFooter
        path="/sessions"
        params={{ classe: classeId, teacher: teacherId }}
        page={page}
        totalPages={totalPages}
        total={total}
        pdf={pdf}
      />
    </>
  );
}
