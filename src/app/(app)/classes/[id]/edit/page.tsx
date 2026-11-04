import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateClasse } from "@/app/actions/classes";

export default async function EditClassePage({ params }: { params: { id: string } }) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const c = await prisma.classe.findUnique({ where: { id: params.id } });
  if (!c) notFound();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier la classe</h1>
          <p>
            {c.name} ({c.year})
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
            <input name="name" required maxLength={60} defaultValue={c.name} />
          </label>
          <label>
            Année scolaire *
            <input name="year" required pattern="\d{4}-\d{4}" title="Format attendu : 2026-2027" defaultValue={c.year} />
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
