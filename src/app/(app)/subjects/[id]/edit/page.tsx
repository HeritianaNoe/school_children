import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateSubject } from "@/app/actions/subjects";

export default async function EditSubjectPage({ params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  await requireUser(["ADMIN", "DIRECTOR"]);
  const subject = await prisma.subject.findUnique({ where: { id: params.id } });
  if (!subject) notFound();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier la matière</h1>
          <p>{subject.name}</p>
        </div>
        <Link href="/subjects" className="btn-secondary btn">
          ← Toutes les matières
        </Link>
      </div>

      <form action={updateSubject} className="form-section" style={{ maxWidth: 560 }}>
        <input type="hidden" name="id" value={subject.id} />
        <div className="stack">
          <label>
            Nom de la matière *
            <input name="name" required minLength={2} maxLength={80} defaultValue={subject.name} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Enregistrer</button>
          <Link href="/subjects" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
