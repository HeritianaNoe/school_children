import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { fmtDate, fmtTime, toLocalInput } from "@/lib/format";
import AttendanceForm from "@/components/AttendanceForm";
import { saveTeacherAttendance } from "@/app/actions/attendance";
import { changeSessionTeacher } from "@/app/actions/sessions";

export default async function SessionPage({ params }: { params: { id: string } }) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const s = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      course: { include: { classe: { include: { students: { include: { user: true }, orderBy: { user: { name: "asc" } } } } }, subject: true } },
      teacher: { include: { user: true } },
      studentAttendance: true,
      teacherAttendance: true,
    },
  });
  if (!s) notFound();
  if (u.role === "TEACHER" && s.teacher.userId !== u.id) throw new Error("Forbidden");

  const att = new Map(s.studentAttendance.map((a) => [a.studentId, a]));
  const initial = s.course.classe.students.map((st) => {
    const a = att.get(st.id);
    return { studentId: st.id, name: st.user.name, status: a?.status ?? "PRESENT", minutesLate: a?.minutesLate ?? 0, note: a?.note ?? "" };
  });
  const teachers = isStaff(u.role) ? await prisma.teacher.findMany({ include: { user: true } }) : [];
  const ta = s.teacherAttendance;

  return (
    <>
      <h1>{s.course.subject.name} — {s.course.classe.name}</h1>
      <p className="muted">{fmtDate(s.startsAt)} {fmtTime(s.startsAt)}–{fmtTime(s.endsAt)} · Prof: {s.teacher.user.name} · <span className={`tag ${s.status}`}>{s.status}</span></p>

      <h2>Présence des élèves</h2>
      <AttendanceForm sessionId={s.id} initial={initial} />

      {isStaff(u.role) && (
        <>
          <h2>Présence mpampianatra</h2>
          <form action={saveTeacherAttendance} className="stack card">
            <input type="hidden" name="sessionId" value={s.id} />
            <label>Status
              <select name="status" defaultValue={ta?.status ?? "PRESENT"}>
                <option value="PRESENT">Présent</option><option value="LATE">En retard</option>
                <option value="ABSENT">Absent</option><option value="EXCUSED">Absent (justifié)</option>
              </select>
            </label>
            <label>Ora tonga tokoa<input type="datetime-local" name="arrivedAt" defaultValue={toLocalInput(ta?.arrivedAt)} /></label>
            <label>Ora nandeha<input type="datetime-local" name="leftAt" defaultValue={toLocalInput(ta?.leftAt)} /></label>
            <label>Fanamarihana<input name="note" defaultValue={ta?.note ?? ""} /></label>
            <button>Tehirizo</button>
          </form>

          <h2>Mpisolo (remplaçant)</h2>
          <form action={changeSessionTeacher} className="stack">
            <input type="hidden" name="sessionId" value={s.id} />
            <select name="teacherId" defaultValue={s.teacherId}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
            </select>
            <button>Ovay</button>
          </form>
        </>
      )}
    </>
  );
}
