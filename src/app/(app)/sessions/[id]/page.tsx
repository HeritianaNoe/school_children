import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { fmtDate, fmtTime, toTimeInput } from "@/lib/format";
import AttendanceForm from "@/components/AttendanceForm";
import { saveTeacherAttendance } from "@/app/actions/attendance";
import { changeSessionTeacher } from "@/app/actions/sessions";
import { ATTENDANCE_LABEL, SESSION_STATUS_LABEL } from "@/lib/labels";
import { forbidden } from "@/lib/flash";

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
  if (u.role === "TEACHER" && s.teacher.userId !== u.id) forbidden();

  const att = new Map(s.studentAttendance.map((a) => [a.studentId, a]));
  const rows = s.course.classe.students.map((st) => {
    const a = att.get(st.id);
    return { studentId: st.id, name: st.user.name, status: a?.status ?? "PRESENT", minutesLate: a?.minutesLate ?? 0, note: a?.note ?? "" };
  });
  const teachers = isStaff(u.role) ? await prisma.teacher.findMany({ include: { user: true } }) : [];
  const ta = s.teacherAttendance;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            {s.course.subject.name} — {s.course.classe.name}
          </h1>
          <p>
            {fmtDate(s.startsAt)} · {fmtTime(s.startsAt)}–{fmtTime(s.endsAt)} · Enseignant : {s.teacher.user.name} ·{" "}
            <span className={`tag ${s.status}`}>{SESSION_STATUS_LABEL[s.status]}</span>
          </p>
        </div>
        <Link href="/sessions" className="btn-secondary btn">
          ← Retour aux séances
        </Link>
      </div>

      <h2>Présence des élèves</h2>
      <AttendanceForm sessionId={s.id} rows={rows} />

      {isStaff(u.role) && (
        <>
          <h2>Présence de l&apos;enseignant</h2>
          <form action={saveTeacherAttendance} className="stack card">
            <input type="hidden" name="sessionId" value={s.id} />
            <label>
              Statut
              <select name="status" defaultValue={ta?.status ?? "PRESENT"}>
                {Object.entries(ATTENDANCE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {v === "EXCUSED" ? "Absent (justifié)" : l}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <label>
                Heure d&apos;arrivée réelle
                <input type="time" name="arrivedAt" defaultValue={toTimeInput(ta?.arrivedAt)} />
              </label>
              <label>
                Heure de départ
                <input type="time" name="leftAt" defaultValue={toTimeInput(ta?.leftAt)} />
              </label>
            </div>
            <label>
              Remarque
              <input name="note" maxLength={300} defaultValue={ta?.note ?? ""} />
            </label>
            <div>
              <button type="submit">Enregistrer la présence</button>
            </div>
          </form>

          <h2>Remplaçant</h2>
          <form action={changeSessionTeacher} className="card inline-form">
            <input type="hidden" name="sessionId" value={s.id} />
            <select name="teacherId" defaultValue={s.teacherId} aria-label="Enseignant de la séance">
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
            <button type="submit">Changer l&apos;enseignant</button>
          </form>
        </>
      )}
    </>
  );
}
