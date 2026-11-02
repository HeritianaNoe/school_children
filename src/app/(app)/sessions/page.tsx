import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/format";

export default async function Sessions() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const sessions = await prisma.session.findMany({
    where: u.role === "TEACHER" ? { teacher: { userId: u.id } } : {},
    orderBy: { startsAt: "desc" },
    take: 60,
    include: { course: { include: { classe: true, subject: true } }, teacher: { include: { user: true } }, teacherAttendance: true },
  });
  return (
    <>
      <h1>Séances</h1>
      {isStaff(u.role) && <p><Link href="/sessions/new">+ Séance vaovao</Link></p>}
      <table>
        <thead><tr><th>Daty</th><th>Ora</th><th>Classe</th><th>Matière</th><th>Prof</th><th>Status</th><th>Prof présence</th><th></th></tr></thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{fmtDate(s.startsAt)}</td>
              <td>{fmtTime(s.startsAt)}–{fmtTime(s.endsAt)}</td>
              <td>{s.course.classe.name}</td>
              <td>{s.course.subject.name}</td>
              <td>{s.teacher.user.name}</td>
              <td><span className={`tag ${s.status}`}>{s.status}</span></td>
              <td>{s.teacherAttendance ? <span className={`tag ${s.teacherAttendance.status}`}>{s.teacherAttendance.status}</span> : "—"}</td>
              <td><Link href={`/sessions/${s.id}`}>Hijery</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
