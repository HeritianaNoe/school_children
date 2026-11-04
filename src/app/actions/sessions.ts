"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";

const schema = z.object({
  courseId: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export async function createSessionAction(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) fail("/sessions/new", "validation");
  const d = p.data;
  if (d.endsAt <= d.startsAt) fail("/sessions/new", "session_dates");
  const course = await prisma.course.findUnique({ where: { id: d.courseId } });
  if (!course) fail("/sessions/new", "not_found");
  const s = await prisma.session.create({ data: { ...d, teacherId: course.teacherId } });
  done(`/sessions/${s.id}`, "session_created");
}

export async function changeSessionTeacher(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("sessionId"));
  const teacherId = String(fd.get("teacherId"));
  await prisma.session.update({ where: { id }, data: { teacherId } });
  done(`/sessions/${id}`, "session_teacher_changed");
}

export async function deleteSession(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("id") ?? "");
  const s = await prisma.session.findUnique({ where: { id }, select: { id: true } });
  if (!s) fail("/sessions", "not_found");

  // Les présences des élèves et de l'enseignant sont supprimées avec la séance ;
  // les commentaires sont conservés mais détachés de la séance.
  await prisma.$transaction([
    prisma.comment.updateMany({ where: { sessionId: id }, data: { sessionId: null } }),
    prisma.studentAttendance.deleteMany({ where: { sessionId: id } }),
    prisma.teacherAttendance.deleteMany({ where: { sessionId: id } }),
    prisma.session.delete({ where: { id } }),
  ]);
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  done("/sessions", "session_deleted");
}
