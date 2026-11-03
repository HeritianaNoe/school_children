"use client";

import { useTransition } from "react";
import { saveGrades, deleteGrade } from "@/app/actions/grades";
import ConfirmButton from "./ConfirmButton";

type Row = { studentId: string; name: string; score: number | null; gradeId?: string | null };

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
    <>
      <form action={(fd) => start(() => saveGrades(fd))}>
        <input type="hidden" name="assessmentId" value={assessmentId} />
        <p className="muted" style={{ marginBottom: 12 }}>
          Note sur {maxScore}. Laissez le champ vide si l&apos;élève était absent.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Élève</th>
                <th>Note</th>
                <th></th>
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
                  <td>
                    {r.gradeId && (
                      <ConfirmButton
                        form={`del-${r.gradeId}`}
                        message={`Supprimer la note de ${r.name} ?`}
                        className="btn-secondary btn-sm"
                      >
                        Supprimer
                      </ConfirmButton>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted" style={{ textAlign: "center", padding: 24 }}>
                    Aucun élève dans cette classe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={pending || rows.length === 0}>
            {pending ? "Enregistrement…" : "Enregistrer les notes"}
          </button>
        </div>
      </form>

      {/* Formulaires de suppression (hors du formulaire principal : les formulaires ne s'imbriquent pas) */}
      {rows
        .filter((r) => r.gradeId)
        .map((r) => (
          <form key={r.gradeId} id={`del-${r.gradeId}`} action={deleteGrade}>
            <input type="hidden" name="gradeId" value={r.gradeId!} />
          </form>
        ))}
    </>
  );
}
