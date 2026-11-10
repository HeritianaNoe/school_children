import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtUtcDate, toUtcDateInput } from "@/lib/format";
import { SCHOOL_YEAR_STATUS_LABEL, SCHOOL_YEAR_STATUS_VALUES } from "@/lib/labels";
import {
  createSchoolYear,
  updateSchoolYear,
  setCurrentSchoolYear,
  deleteSchoolYear,
} from "@/app/actions/school-years";
import ConfirmButton from "@/components/ConfirmButton";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";
import AddDialog from "@/components/AddDialog";

/** Années scolaires : création, année courante, statut et historique des classes. Réservé à l'administrateur et au directeur. */
export default async function SchoolYearsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireUser(["ADMIN", "DIRECTOR"]);

  const years = await prisma.schoolYear.findMany({
    orderBy: { startDate: "desc" },
    include: {
      classes: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { students: true, courses: true } },
          courses: { select: { teacherId: true, _count: { select: { sessions: true, assessments: true } } } },
        },
      },
    },
  });

  // Suggestion pour le formulaire : l'année qui suit la dernière année enregistrée (ou l'année en cours)
  const lastStart = years[0]?.startDate.getUTCFullYear();
  const now = new Date();
  const nextStart = lastStart !== undefined ? lastStart + 1 : now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Années scolaires</h1>
          <p>Gestion des années scolaires et historique des classes, élèves et activités</p>
        </div>
        <AddDialog label="Ajouter une année scolaire" title="Ajouter une année scolaire" maxWidth={600}>
          <form action={createSchoolYear}>
            <div className="form-grid">
              <label>
                Nom *
                <input
                  name="name"
                  required
                  maxLength={20}
                  pattern="\d{4}-\d{4}"
                  title="Format attendu : 2026-2027"
                  defaultValue={`${nextStart}-${nextStart + 1}`}
                />
              </label>
              <label>
                Statut
                <select name="status" defaultValue="UPCOMING">
                  {SCHOOL_YEAR_STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {SCHOOL_YEAR_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Début *
                <input name="startDate" type="date" required defaultValue={`${nextStart}-09-01`} />
              </label>
              <label>
                Fin *
                <input name="endDate" type="date" required defaultValue={`${nextStart + 1}-07-15`} />
              </label>
            </div>
            <label style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
              <input type="checkbox" name="isCurrent" style={{ width: "auto" }} />
              Définir comme année courante
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" data-dialog-close>
                Annuler
              </button>
              <button type="submit">Ajouter</button>
            </div>
          </form>
        </AddDialog>
      </div>

      {years.length === 0 && <div className="card muted">Aucune année scolaire enregistrée.</div>}

      <div className="stack">
        {years.map((y) => {
          const rows = y.classes.map((c) => ({
            id: c.id,
            name: c.name,
            students: c._count.students,
            courses: c._count.courses,
            teachers: new Set(c.courses.map((x) => x.teacherId)).size,
            sessions: c.courses.reduce((n, x) => n + x._count.sessions, 0),
            assessments: c.courses.reduce((n, x) => n + x._count.assessments, 0),
          }));
          const total = (k: "students" | "sessions" | "assessments") => rows.reduce((n, r) => n + r[k], 0);
          const plural = (n: number) => (n > 1 ? "s" : "");
          const pageKey = `p_${y.id}`;
          const yp = paginate(rows, searchParams[pageKey]);
          const keepParams = Object.fromEntries(
            Object.entries(searchParams).filter(([k]) => k.startsWith("p_") && k !== pageKey)
          );
          const yearPdf = {
            title: `Classes - année scolaire ${y.name}`,
            subtitle: `${rows.length} classe${plural(rows.length)} · ${total("students")} élève${plural(total("students"))} · ${total("sessions")} séance${plural(total("sessions"))} · ${total("assessments")} évaluation${plural(total("assessments"))}`,
            headers: ["Classe", "Élèves", "Matières", "Enseignants", "Séances", "Évaluations"],
            rows: rows.map((r) => [r.name, String(r.students), String(r.courses), String(r.teachers), String(r.sessions), String(r.assessments)]),
          };

          return (
            <section className="card" key={y.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>
                  {y.name}
                  {y.isCurrent && (
                    <span className="tag PRESENT" style={{ marginLeft: 10, verticalAlign: "middle" }}>
                      Courante
                    </span>
                  )}
                  <span className="tag" style={{ marginLeft: 8, verticalAlign: "middle" }}>
                    {SCHOOL_YEAR_STATUS_LABEL[y.status]}
                  </span>
                </h2>
                <span className="muted">
                  {fmtUtcDate(y.startDate)} → {fmtUtcDate(y.endDate)}
                </span>
              </div>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                {rows.length} classe{plural(rows.length)} · {total("students")} élève{plural(total("students"))} ·{" "}
                {total("sessions")} séance{plural(total("sessions"))} · {total("assessments")} évaluation
                {plural(total("assessments"))}
              </p>

              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer" }}>Modifier cette année</summary>
                <form action={updateSchoolYear} style={{ marginTop: 10 }}>
                  <input type="hidden" name="id" value={y.id} />
                  <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr auto", alignItems: "end" }}>
                    <label>
                      Nom *
                      <input name="name" required maxLength={20} pattern="\d{4}-\d{4}" defaultValue={y.name} />
                    </label>
                    <label>
                      Début *
                      <input name="startDate" type="date" required defaultValue={toUtcDateInput(y.startDate)} />
                    </label>
                    <label>
                      Fin *
                      <input name="endDate" type="date" required defaultValue={toUtcDateInput(y.endDate)} />
                    </label>
                    <label>
                      Statut
                      <select name="status" defaultValue={y.status}>
                        {SCHOOL_YEAR_STATUS_VALUES.map((s) => (
                          <option key={s} value={s}>
                            {SCHOOL_YEAR_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className="btn-secondary">
                      Enregistrer
                    </button>
                  </div>
                </form>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {!y.isCurrent && (y.status === "UPCOMING" || y.status === "ACTIVE") && (
                    <form action={setCurrentSchoolYear}>
                      <input type="hidden" name="id" value={y.id} />
                      <button type="submit" className="btn-secondary btn-sm">
                        Définir comme année courante
                      </button>
                    </form>
                  )}
                  <form action={deleteSchoolYear}>
                    <input type="hidden" name="id" value={y.id} />
                    <ConfirmButton
                      message={`Supprimer l'année scolaire ${y.name} ? Cette action est irréversible.`}
                      className="btn-ghost btn-sm"
                      disabled={rows.length > 0}
                    >
                      Supprimer
                    </ConfirmButton>
                  </form>
                </div>
              </details>

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
                    {yp.items.map((r) => (
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
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 20 }}>
                          Aucune classe dans cette année scolaire.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TableFooter
                path="/school-years"
                pageParam={pageKey}
                params={keepParams}
                page={yp.page}
                totalPages={yp.totalPages}
                total={yp.total}
                pdf={yearPdf}
              />
            </section>
          );
        })}
      </div>
    </>
  );
}
