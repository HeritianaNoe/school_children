import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateTerm } from "@/app/actions/terms";
import { toDateInput } from "@/lib/format";

export default async function EditTermPage({ params }: { params: { id: string } }) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const [term, schoolYears] = await Promise.all([
    prisma.term.findUnique({
      where: { id: params.id },
      include: { schoolYear: true },
    }),
    prisma.schoolYear.findMany({ orderBy: { startDate: "desc" } }),
  ]);
  if (!term) notFound();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier la période</h1>
          <p>
            {term.name} · {term.schoolYear.name}
          </p>
        </div>
        <Link href="/terms" className="btn-secondary btn">
          ← Toutes les périodes
        </Link>
      </div>

      <form action={updateTerm} className="form-section" style={{ maxWidth: 560 }}>
        <input type="hidden" name="id" value={term.id} />
        <div className="stack">
          <label>
            Nom *
            <input name="name" required maxLength={60} defaultValue={term.name} />
          </label>
          <label>
            Année scolaire *
            <select name="schoolYearId" required defaultValue={term.schoolYearId}>
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
            <input name="startDate" type="date" required defaultValue={toDateInput(term.startDate)} />
          </label>
          <label>
            Fin *
            <input name="endDate" type="date" required defaultValue={toDateInput(term.endDate)} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Enregistrer</button>
          <Link href="/terms" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
