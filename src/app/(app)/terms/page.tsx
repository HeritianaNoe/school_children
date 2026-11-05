import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icons";
import { requireUser } from "@/lib/session";
import { createTerm, deleteTerm } from "@/app/actions/terms";
import { fmtDateFull } from "@/lib/format";
import ConfirmButton from "@/components/ConfirmButton";

export default async function TermsPage() {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);

  const [terms, schoolYears] = await Promise.all([
    prisma.term.findMany({
      include: {
        schoolYear: true,
        _count: { select: { assessments: true } },
      },
      orderBy: [{ schoolYear: { startDate: "desc" } }, { startDate: "asc" }],
    }),
    prisma.schoolYear.findMany({
      orderBy: { startDate: "desc" },
    }),
  ]);

  const currentYearId = schoolYears.find((y) => y.isCurrent)?.id ?? schoolYears[0]?.id ?? "";

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Périodes</h1>
          <p>Trimestres ou semestres auxquels sont rattachées les évaluations</p>
        </div>
      </div>

      <form action={createTerm} className="form-section" style={{ maxWidth: 900 }}>
        <h3>Ajouter une période</h3>
        <div
          className="form-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr)) auto", alignItems: "end" }}
        >
          <label>
            Nom *
            <input name="name" required maxLength={60} placeholder="Trimestre 1" />
          </label>
          <label>
            Année scolaire *
            <select name="schoolYearId" required defaultValue={currentYearId}>
              {schoolYears.length === 0 && <option value="">Aucune année</option>}
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.isCurrent ? " (courante)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Début *
            <input name="startDate" type="date" required />
          </label>
          <label>
            Fin *
            <input name="endDate" type="date" required />
          </label>
          <button type="submit" disabled={schoolYears.length === 0}>
            Ajouter
          </button>
        </div>
        {schoolYears.length === 0 && (
          <p className="muted" style={{ marginTop: 10, fontSize: "0.9rem" }}>
            Créez d&apos;abord une année scolaire dans « Années scolaires » avant d&apos;ajouter une période.
          </p>
        )}
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Année scolaire</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Évaluations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                </td>
                <td>
                  {t.schoolYear.name}
                  {t.schoolYear.isCurrent && (
                    <span className="tag PRESENT" style={{ marginLeft: 8, verticalAlign: "middle" }}>
                      Courante
                    </span>
                  )}
                </td>
                <td>{fmtDateFull(t.startDate)}</td>
                <td>{fmtDateFull(t.endDate)}</td>
                <td className="muted">
                  {t._count.assessments} évaluation{t._count.assessments > 1 ? "s" : ""}
                </td>
                <td>
                  <div className="row">
                    <Link href={`/terms/${t.id}/edit`} className="btn-ghost btn-sm" title="Modifier" aria-label="Modifier">
                      <Icon name="pencil" size={16} />
                    </Link>
                    <form action={deleteTerm}>
                      <input type="hidden" name="id" value={t.id} />
                      <ConfirmButton
                        message={`Supprimer la période « ${t.name} » ?`}
                        disabled={t._count.assessments > 0}
                        className="btn-ghost btn-sm"
                        title="Supprimer"
                      >
                        <Icon name="trash" size={16} />
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 28 }}>
                  Aucune période définie. Créez-en une pour pouvoir enregistrer des évaluations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
