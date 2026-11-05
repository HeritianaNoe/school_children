import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtDateFull, fmtTime } from "@/lib/format";
import { getPresents, parseDay } from "@/lib/presents";
import PrintCardButton from "@/components/PrintCardButton";
import { studentImageUrl } from "@/lib/avatar";
import { ATTENDANCE_LABEL } from "@/lib/labels";

/** Élèves présents, par séance et par jour. Visible par tous les comptes connectés. */
export default async function PresentsPage({
  searchParams,
}: {
  searchParams: { date?: string; classe?: string };
}) {
  const u = await requireUser();
  // Élève : sa propre classe uniquement, avec un filtre par date seulement (pas de filtre de classe)
  const isStudent = u.role === "STUDENT";
  const own = isStudent ? await prisma.student.findUnique({ where: { userId: u.id }, select: { classeId: true } }) : null;

  const day = parseDay(searchParams.date);
  const classes = await prisma.classe.findMany({
    where: { students: { some: {} } }, // uniquement les classes qui ont des élèves
    include: { schoolYear: true },
    orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }],
  });
  const classeId = isStudent
    ? own?.classeId ?? ""
    : classes.some((c) => c.id === searchParams.classe)
      ? (searchParams.classe as string)
      : "";
  const { start, sessions } =
    isStudent && !classeId ? { start: new Date(`${day}T00:00:00`), sessions: [] } : await getPresents(day, classeId || undefined);

  // Grouper les séances par classe (ordre d'apparition = ordre des séances)
  const groups: { classeId: string; classeName: string; year: string; sessions: typeof sessions }[] = [];
  const indexByClasse = new Map<string, number>();
  for (const s of sessions) {
    const cid = s.course.classe.id;
    let idx = indexByClasse.get(cid);
    if (idx === undefined) {
      idx = groups.length;
      indexByClasse.set(cid, idx);
      groups.push({
        classeId: cid,
        classeName: s.course.classe.name,
        year: s.course.classe.schoolYear.name,
        sessions: [],
      });
    }
    groups[idx].sessions.push(s);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Élèves présents</h1>
          <p>Liste des élèves présents à chaque séance · {fmtDateFull(start)}</p>
        </div>
      </div>

      {isStudent && (
        <form method="get" className="filters no-print">
          <label>
            Date
            <input type="date" name="date" defaultValue={day} required />
          </label>
          <button type="submit">Afficher</button>
        </form>
      )}
      {!isStudent && (
      <form method="get" className="filters no-print">
        <label>
          Date
          <input type="date" name="date" defaultValue={day} required />
        </label>
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
        <button type="submit">Afficher</button>
      </form>
      )}

      {sessions.length === 0 && (
        <div className="card muted" style={{ textAlign: "center", padding: 28 }}>
          Aucune séance ce jour-là.
        </div>
      )}

      <div className="stack">
        {groups.map((g) => (
          <div key={g.classeId}>
            {/* En-tête de classe (utile surtout quand « Toutes les classes ») */}
            {!classeId && (
              <h2 style={{ margin: "18px 0 10px", fontSize: "1.15rem" }}>
                {g.classeName}
                <span className="muted" style={{ fontWeight: 400, fontSize: "0.9rem", marginLeft: 8 }}>
                  ({g.year}) · {g.sessions.length} séance{g.sessions.length > 1 ? "s" : ""}
                </span>
              </h2>
            )}

            {g.sessions.map((s) => {
              const { present, called, replacedTeacher } = s;
              const hasTable = called && present.length > 0;
              const query = new URLSearchParams({ date: day, session: s.id }).toString();
              return (
                <section key={s.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <strong style={{ fontSize: "1.05rem" }}>
                        {s.course.subject.name}
                        {classeId ? (
                          <> — {s.course.classe.name}</>
                        ) : null}
                      </strong>
                      <div className="muted" style={{ fontSize: "0.88rem", marginTop: 2 }}>
                        {fmtTime(s.startsAt)} – {fmtTime(s.endsAt)} · {s.teacher.user.name}
                      </div>
                    </div>
                    {called && (
                      <span className="tag PRESENT">
                        {present.length} présent{present.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {!called ? (
                      <p className="muted">L&apos;appel n&apos;a pas encore été effectué.</p>
                    ) : present.length === 0 ? (
                      <p className="muted">Aucun élève présent.</p>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Élève</th>
                              <th>Statut</th>
                              <th>Retard</th>
                            </tr>
                          </thead>
                          <tbody>
                            {present.map((a) => (
                              <tr key={a.id}>
                                <td>
                                  <div className="row">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={studentImageUrl(a.student)} alt="" className="thumb" />
                                    <span>
                                      {a.student.lastName.toUpperCase()} {a.student.firstName}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`tag ${a.status}`}>{ATTENDANCE_LABEL[a.status] ?? a.status}</span>
                                </td>
                                <td>{a.minutesLate > 0 ? `${a.minutesLate} min` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {(hasTable || replacedTeacher) && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 14,
                      }}
                    >
                      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {hasTable && (
                          <>
                            <a href={`/api/presents?${query}`} className="btn">
                              PDF
                            </a>
                            <PrintCardButton label="Imprimer" />
                          </>
                        )}
                      </div>
                      {replacedTeacher && (
                        <div
                          role="note"
                          style={{
                            marginLeft: "auto",
                            textAlign: "right",
                            fontSize: "0.88rem",
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: "var(--warning-soft)",
                            color: "#92400e",
                          }}
                        >
                          <strong>Remarque :</strong> enseignant remplacé — {s.teacher.user.name} remplace{" "}
                          {replacedTeacher}.
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
