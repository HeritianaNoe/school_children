import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import { ASSESSMENT_TYPE_LABEL } from "@/lib/labels";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: { classe?: string };
}) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const classeId = searchParams.classe ?? "";
  const ownCourses = u.role === "TEACHER" ? { teacher: { userId: u.id } } : {};

  const classes = await prisma.classe.findMany({
    where: { courses: { some: ownCourses } },
    include: { schoolYear: true },
    orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }],
  });
  const list = await prisma.assessment.findMany({
    where: { course: { ...ownCourses, ...(classeId ? { classeId } : {}) } },
    orderBy: { date: "desc" },
    take: 100,
    include: {
      course: { include: { classe: { include: { schoolYear: true } }, subject: true } },
      term: { include: { schoolYear: true } },
      _count: { select: { grades: true } },
    },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notes et évaluations</h1>
          <p>Devoirs, interrogations et examens, avec saisie des notes</p>
        </div>
        <Link href="/assessments/new" className="btn">
          <Icon name="plus" size={16} />
          Nouvelle évaluation
        </Link>
      </div>

      <form method="get" className="filters">
        <label>
          Classe
          <select name="classe" defaultValue={classeId}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.schoolYear.name})
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filtrer</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Classe</th>
              <th>Matière</th>
              <th>Période</th>
              <th>Coef.</th>
              <th>Notes saisies</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.date)}</td>
                <td>
                  <span className="tag">{ASSESSMENT_TYPE_LABEL[a.type] ?? a.type}</span>
                </td>
                <td>{a.course.classe.name}</td>
                <td>{a.course.subject.name}</td>
                <td className="muted">
                  {a.term.name}
                  <span style={{ opacity: 0.75 }}> ({a.term.schoolYear.name})</span>
                </td>
                <td>{a.coefficient}</td>
                <td>{a._count.grades}</td>
                <td>
                  <Link href={`/assessments/${a.id}`} className="btn-ghost btn-sm" title="Saisir / voir les notes" aria-label="Notes">
                    <Icon name="clipboard" size={16} />
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
