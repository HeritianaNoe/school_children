import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

/**
 * Emploi du temps à afficher pour un utilisateur.
 * `vue` = « c:<classeId> » ou « t:<teacherId> ».
 * Élève : sa classe uniquement ; enseignant : son propre emploi du temps uniquement (le paramètre est ignoré dans les deux cas) ;
 * direction : choix libre, 1re classe par défaut.
 */
export async function getTimetable(u: SessionUser, rawVue?: string | null) {
  const isStudent = u.role === "STUDENT";
  const [student, teacher, firstClasse] = await Promise.all([
    isStudent ? prisma.student.findUnique({ where: { userId: u.id } }) : null,
    u.role === "TEACHER" ? prisma.teacher.findUnique({ where: { userId: u.id } }) : null,
    isStudent || u.role === "TEACHER"
      ? null
      : prisma.classe.findFirst({ orderBy: [{ year: "desc" }, { name: "asc" }] }),
  ]);

  let vue = rawVue ?? "";
  if (isStudent) vue = student ? `c:${student.classeId}` : "";
  else if (u.role === "TEACHER") vue = teacher ? `t:${teacher.id}` : "";
  else if (!vue) vue = firstClasse ? `c:${firstClasse.id}` : "";

  const [kind, targetId] = vue.split(":");
  const byClass = kind === "c";

  const slots = targetId
    ? await prisma.timetableSlot.findMany({
        where: { course: byClass ? { classeId: targetId } : { teacherId: targetId } },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        include: { course: { include: { subject: true, classe: true, teacher: { include: { user: true } } } } },
      })
    : [];

  let title: string | undefined;
  if (targetId) {
    title = byClass
      ? (await prisma.classe.findUnique({ where: { id: targetId } }))?.name
      : (await prisma.teacher.findUnique({ where: { id: targetId }, include: { user: true } }))?.user.name;
  }

  return { vue, byClass, targetId: targetId ?? "", title, slots };
}
