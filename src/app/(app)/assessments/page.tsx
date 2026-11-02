import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtDate } from "@/lib/format";

export default async function AssessmentsPage() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const list = await prisma.assessment.findMany({
    where: u.role === "TEACHER" ? { course: { teacher: { userId: u.id } } } : {},
    orderBy: { date: "desc" },
    take: 60,
    include: { course: { include: { classe: true, subject: true } }, term: true },
  });

  const typeLabel: Record<string, string> = {
    HOMEWORK: "Devoir",
    TEST: "Interro",
    EXAM: "Examen",
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Évaluations</h1>
          <p>Notes et contrôles</p>
        </div>
        <Link href="/assessments/new" className="btn">
          + Nouvelle évaluation
        </Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Titre</th>
              <th>Type</th>
              <th>Classe</th>
              <th>Matière</th>
              <th>Période</th>
              <th>Coef.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.date)}</td>
                <td>{a.title}</td>
                <td>
                  <span className="tag">{typeLabel[a.type] ?? a.type}</span>
                </td>
                <td>{a.course.classe.name}</td>
                <td>{a.course.subject.name}</td>
                <td className="muted">{a.term.name}</td>
                <td>{a.coefficient}</td>
                <td>
                  <Link href={`/assessments/${a.id}`} className="btn-ghost btn-sm">
                    Notes
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="muted" style={{ textAlign: "center", padding: 28 }}>
                  Aucune évaluation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
