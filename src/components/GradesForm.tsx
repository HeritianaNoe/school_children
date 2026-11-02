"use client";
import { useState, useTransition } from "react";
import { saveGrades } from "@/app/actions/grades";

type Row = { studentId: string; name: string; score: string };

export default function GradesForm({
  assessmentId, maxScore, initial,
}: { assessmentId: string; maxScore: number; initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const submit = () =>
    start(async () => {
      try {
        await saveGrades({
          assessmentId,
          grades: rows.map((r) => ({
            studentId: r.studentId,
            score: r.score.trim() === "" ? null : Number(r.score.replace(",", ".")),
          })),
        });
        setMsg("Voatahiry ✔");
      } catch (e) {
        setMsg("Hadisoana: " + (e as Error).message);
      }
    });

  return (
    <div>
      <p className="muted">Avelao banga ny noty raha tsy tonga ilay mpianatra. Noty /{maxScore}</p>
      <table>
        <thead><tr><th>Mpianatra</th><th>Noty</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.studentId}>
              <td>{r.name}</td>
              <td>
                <input inputMode="decimal" style={{ width: 90 }} value={r.score}
                  onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, score: e.target.value } : y)))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><button onClick={submit} disabled={pending}>{pending ? "..." : "Tehirizo"}</button> {msg}</p>
    </div>
  );
}
