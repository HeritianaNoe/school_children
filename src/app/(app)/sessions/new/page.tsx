import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createSessionAction } from "@/app/actions/sessions";

export default async function NewSession() {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const courses = await prisma.course.findMany({
    include: { classe: true, subject: true, teacher: { include: { user: true } } },
    orderBy: { classe: { name: "asc" } },
  });
  return (
    <>
      <h1>Séance vaovao</h1>
      <form action={createSessionAction} className="stack">
        <label>Cours
          <select name="courseId" required>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.classe.name} · {c.subject.name} · {c.teacher.user.name}</option>
            ))}
          </select>
        </label>
        <label>Fanombohana<input type="datetime-local" name="startsAt" required /></label>
        <label>Farany<input type="datetime-local" name="endsAt" required /></label>
        <button>Hamorona</button>
      </form>
    </>
  );
}
