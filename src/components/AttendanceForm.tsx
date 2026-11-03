"use client";

import { useTransition } from "react";
import { saveAttendance } from "@/app/actions/attendance";

type Row = {
  studentId: string;
  name: string;
  status: string;
  minutesLate: number;
  note: string;
};

export default function AttendanceForm({
  sessionId,
  rows,
  initial,
}: {
  sessionId: string;
  rows?: Row[];
  initial?: Row[];
}) {
  const [pending, start] = useTransition();
  const dataRows = rows ?? initial ?? [];

  return (
    <form
      action={(fd) => start(() => saveAttendance(fd))}
      className="table-wrap"
      style={{ padding: 0 }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <table>
        <thead>
          <tr>
            <th>Élève</th>
            <th>Statut</th>
            <th>Minutes de retard</th>
            <th>Remarque</th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((r, i) => (
            <tr key={r.studentId}>
              <td>
                {r.name}
                <input type="hidden" name={`rows[${i}].studentId`} value={r.studentId} />
              </td>
              <td>
                <select name={`rows[${i}].status`} defaultValue={r.status}>
                  <option value="PRESENT">Présent</option>
                  <option value="LATE">En retard</option>
                  <option value="ABSENT">Absent</option>
                  <option value="EXCUSED">Justifié</option>
                </select>
              </td>
              <td>
                <input
                  name={`rows[${i}].minutesLate`}
                  type="number"
                  min={0}
                  defaultValue={r.minutesLate}
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input name={`rows[${i}].note`} defaultValue={r.note} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: 12 }}>
        <button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les présences"}
        </button>
      </div>
    </form>
  );
}
