"use server";
import { z } from "zod";
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
