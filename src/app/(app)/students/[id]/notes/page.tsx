import Link from "next/link";
import PdfLink from "@/components/PdfLink";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { forbidden } from "@/lib/flash";
import { fmtDate } from "@/lib/format";

export default async function StudentNotesPage({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, classe: { include: { schoolYear: true } } },
  });
  if (!s) notFound();
  if (u.role === "STUDENT" && s.userId !== u.id) forbidden();

  const grades = await prisma.grade.findMany({
    where: { studentId: s.id, score: { not: null } },
    orderBy: [{ assessment: { date: "desc" } }],
    include: {
      assessment: {
        include: {
          course: { include: { subject: true } },
          term: true,
        },
      },
    },
  });

  const bySubject = new Map<
    string,
    { name: string; entries: { id: string; title: string; date: Date; term: string; score: number; maxScore: number; coefficient: number }[] }
  >();

  for (const g of grades) {
    const key = g.assessment.course.subjectId;
    const subject = bySubject.get(key) ?? {
      name: g.assessment.course.subject.name,
      entries: [],
    };
    subject.entries.push({
      id: g.id,
      title: g.assessment.title,
      date: g.assessment.date,
      term: g.assessment.term?.name ?? "—",
      score: g.score ?? 0,
      maxScore: g.assessment.maxScore,
      coefficient: g.assessment.coefficient,
    });
    bySubject.set(key, subject);
  }

  const subjectRows = [...bySubject.entries()].map(([_, subject]) => {
    const total = subject.entries.reduce((sum, entry) => sum + (entry.score / entry.maxScore) * 20, 0);
    const avg = subject.entries.length ? +(total / subject.entries.length).toFixed(2) : null;
    return { ...subject, avg };
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notes par matière</h1>
          <p>
            {s.lastName.toUpperCase()} {s.firstName} · {s.classe.name} ({s.classe.schoolYear.name})
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/students/${s.id}`} className="btn-secondary btn">
            ← Dossier de l'élève
          </Link>
        </div>
      </div>

      {subjectRows.length === 0 ? (
        <div className="card muted">Aucune note enregistrée pour le moment.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {subjectRows.map((subject, i) => (
            <section
              key={subject.name}
              style={{ padding: 20, borderTop: i === 0 ? "none" : "1px solid var(--border, #e2e8f0)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{subject.name}</h3>
                <strong>{subject.avg ?? "—"} / 20</strong>
              </div>

              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Évaluation</th>
                      <th>Période</th>
                      <th>Date</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.title}</td>
                        <td>{entry.term}</td>
                        <td>{fmtDate(entry.date)}</td>
                        <td>
                          {entry.score} / {entry.maxScore}
                          {entry.coefficient > 1 && <span className="muted"> · coef {entry.coefficient}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
        <PdfLink href={`/api/students/${s.id}/notes`} />
      </div>

    </>
  );
}
