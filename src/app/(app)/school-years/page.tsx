import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/** Historique des années scolaires : réservé à l'administrateur et au directeur. */
export default async function SchoolYearsPage() {
  await requireUser(["ADMIN", "DIRECTOR"]);

  const classes = await prisma.classe.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { students: true, courses: true } },
      courses: { select: { teacherId: true, _count: { select: { sessions: true, assessments: true } } } },
    },
  });

  // Regroupement par année scolaire (la plus récente en premier)
  const years = new Map<
    string,
    { year: string; rows: { id: string; name: string; students: number; courses: number; teachers: number; sessions: number; assessments: number }[] }
  >();
  for (const c of classes) {
    const y = years.get(c.year) ?? { year: c.year, rows: [] };
    y.rows.push({
      id: c.id,
      name: c.name,
      students: c._count.students,
      courses: c._count.courses,
      teachers: new Set(c.courses.map((x) => x.teacherId)).size,
      sessions: c.courses.reduce((n, x) => n + x._count.sessions, 0),
      assessments: c.courses.reduce((n, x) => n + x._count.assessments, 0),
    });
    years.set(c.year, y);
  }
  const list = [...years.values()].sort((a, b) => b.year.localeCompare(a.year));
  const sum = (rows: { [k: string]: number | string }[], k: string) => rows.reduce((n, r) => n + (r[k] as number), 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Historique des années scolaires</h1>
          <p>Classes, élèves et activité de chaque année scolaire</p>
        </div>
      </div>

      {list.length === 0 && <div className="card muted">Aucune année scolaire enregistrée.</div>}

      <div className="stack">
        {list.map((y, i) => (
          <section className="card" key={y.year}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>
                {y.year}
                {i === 0 && (
                  <span className="tag PRESENT" style={{ marginLeft: 10, verticalAlign: "middle" }}>
                    En cours
                  </span>
                )}
              </h2>
              <span className="muted">
                {y.rows.length} classe{y.rows.length > 1 ? "s" : ""} · {sum(y.rows, "students")} élève
                {sum(y.rows, "students") > 1 ? "s" : ""} · {sum(y.rows, "sessions")} séance
                {sum(y.rows, "sessions") > 1 ? "s" : ""} · {sum(y.rows, "assessments")} évaluation
                {sum(y.rows, "assessments") > 1 ? "s" : ""}
              </span>
            </div>

            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Classe</th>
                    <th>Élèves</th>
                    <th>Matières</th>
                    <th>Enseignants</th>
                    <th>Séances</th>
                    <th>Évaluations</th>
                  </tr>
                </thead>
                <tbody>
                  {y.rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/classes/${r.id}?histo=1`}>
                          <strong>{r.name}</strong>
                        </Link>
                      </td>
                      <td>{r.students}</td>
                      <td>{r.courses}</td>
                      <td>{r.teachers}</td>
                      <td>{r.sessions}</td>
                      <td>{r.assessments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
