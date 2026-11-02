"use client";

import { useTransition } from "react";
import { saveGrades } from "@/app/actions/grades";

type Row = { studentId: string; name: string; score: number | null };

export default function GradesForm({
  assessmentId,
  maxScore,
  rows,
}: {
  assessmentId: string;
  maxScore: number;
  rows: Row[];
}) {
  const [pending, start] = useTransition();

  return (
    <form action={(fd) => start(() => saveGrades(fd))}>
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <p className="muted" style={{ marginBottom: 12 }}>
        Laissez vide si l&apos;élève était absent. Note sur {maxScore}.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.studentId}>
                <td>
                  {r.name}
                  <input type="hidden" name={`rows[${i}].studentId`} value={r.studentId} />
                </td>
                <td>
                  <input
                    name={`rows[${i}].score`}
                    type="number"
                    step="0.25"
                    min={0}
                    max={maxScore}
                    defaultValue={r.score ?? ""}
                    style={{ width: 100 }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les notes"}
        </button>
      </div>
    </form>
  );
}
