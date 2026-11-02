import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createSessionAction } from "@/app/actions/sessions";

export default async function NewSessionPage() {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const courses = await prisma.course.findMany({
    include: { classe: true, subject: true, teacher: { include: { user: true } } },
    orderBy: { classe: { name: "asc" } },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvelle séance</h1>
          <p>Planifier un cours</p>
        </div>
        <Link href="/sessions" className="btn-secondary">
          ← Retour
        </Link>
      </div>

      <form action={createSessionAction} className="form-section" style={{ maxWidth: 480 }}>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label>
            Cours
            <select name="courseId" required>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.classe.name} · {c.subject.name} · {c.teacher.user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Début
            <input type="datetime-local" name="startsAt" required />
          </label>
          <label>
            Fin
            <input type="datetime-local" name="endsAt" required />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Créer la séance</button>
        </div>
      </form>
    </>
  );
}
