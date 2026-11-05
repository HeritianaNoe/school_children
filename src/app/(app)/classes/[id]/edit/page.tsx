import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateClasse } from "@/app/actions/classes";

export default async function EditClassePage({ params }: { params: { id: string } }) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const c = await prisma.classe.findUnique({ where: { id: params.id }, include: { schoolYear: true } });
  if (!c) notFound();
  const schoolYears = await prisma.schoolYear.findMany({ orderBy: { startDate: "desc" } });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier la classe</h1>
          <p>
            {c.name} ({c.schoolYear.name})
          </p>
        </div>
        <Link href="/classes" className="btn-secondary btn">
          ← Toutes les classes
        </Link>
      </div>

      <form action={updateClasse} className="form-section" style={{ maxWidth: 560 }}>
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="from" value="list" />
        <div className="stack">
          <label>
            Nom de la classe *
            <input name="name" required maxLength={50} defaultValue={c.name} />
          </label>
          <label>
            Année scolaire *
            <select name="schoolYearId" required defaultValue={c.schoolYearId}>
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.isCurrent ? " (courante)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Salle
            <input name="roomNumber" maxLength={20} defaultValue={c.roomNumber ?? ""} />
          </label>
          <label>
            Capacité
            <input name="capacity" type="number" min={1} max={500} defaultValue={c.capacity ?? ""} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Enregistrer</button>
          <Link href="/classes" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
