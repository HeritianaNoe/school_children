import { DAYS } from "@/lib/timetable";

export type SlotCourseOption = { id: string; label: string };

type Props = {
  action: (fd: FormData) => Promise<void>;
  courses: SlotCourseOption[];
  back: string;
  submitLabel: string;
  slot?: { id: string; courseId: string; dayOfWeek: number; startTime: string; endTime: string; room: string | null };
};

/** Formulaire de créneau (création ou modification). Rendu côté serveur, sans JavaScript client. */
export default function SlotForm({ action, courses, back, submitLabel, slot }: Props) {
  return (
    <form action={action} className="form-section">
      {slot && <input type="hidden" name="id" value={slot.id} />}
      <input type="hidden" name="back" value={back} />
      <div className="form-grid">
        <label>
          Matière / classe / enseignant *
          <select name="courseId" required defaultValue={slot?.courseId ?? ""}>
            <option value="" disabled>
              Choisir…
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Jour *
          <select name="dayOfWeek" required defaultValue={slot?.dayOfWeek ?? 1}>
            {DAYS.map((d) => (
              <option key={d.n} value={d.n}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Début *
          <input type="time" name="startTime" required defaultValue={slot?.startTime ?? "08:00"} />
        </label>
        <label>
          Fin *
          <input type="time" name="endTime" required defaultValue={slot?.endTime ?? "09:00"} />
        </label>
        <label>
          Salle
          <input name="room" maxLength={40} placeholder="Salle 3" defaultValue={slot?.room ?? ""} />
        </label>
      </div>
      <div className="form-actions" style={{ border: 0, paddingTop: 0, marginTop: 12 }}>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
