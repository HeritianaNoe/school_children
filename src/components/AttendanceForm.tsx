"use client";
import { useState, useTransition } from "react";
import { saveStudentAttendance } from "@/app/actions/attendance";

type Row = { studentId: string; name: string; status: string; minutesLate: number; note: string };

export default function AttendanceForm({ sessionId, initial }: { sessionId: string; initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const upd = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const submit = () =>
    start(async () => {
      try {
        await saveStudentAttendance({
          sessionId,
          rows: rows.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            minutesLate: r.status === "LATE" ? Number(r.minutesLate) || 0 : 0,
            note: r.note || undefined,
          })),
        });
        setMsg("Voatahiry ✔");
      } catch (e) {
        setMsg("Hadisoana: " + (e as Error).message);
      }
    });

  return (
    <div>
      <table>
        <thead>
          <tr><th>Mpianatra</th><th>Status</th><th>Minitra tara</th><th>Fanamarihana</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.studentId}>
              <td>{r.name}</td>
              <td>
                <select value={r.status} onChange={(e) => upd(i, { status: e.target.value })}>
                  <option value="PRESENT">Tonga</option>
                  <option value="LATE">Tara</option>
                  <option value="ABSENT">Absent</option>
                  <option value="EXCUSED">Absent (justifié)</option>
                </select>
              </td>
              <td>
                <input type="number" min={0} style={{ width: 70 }} disabled={r.status !== "LATE"}
                  value={r.minutesLate} onChange={(e) => upd(i, { minutesLate: Number(e.target.value) })} />
              </td>
              <td><input value={r.note} onChange={(e) => upd(i, { note: e.target.value })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <button onClick={submit} disabled={pending}>{pending ? "..." : "Tehirizo"}</button> {msg}
      </p>
    </div>
  );
}
