"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const schema = z.object({
  courseId: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export async function createSessionAction(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const d = schema.parse(Object.fromEntries(fd));
  if (d.endsAt <= d.startsAt) throw new Error("Horaire de fin invalide");
  const course = await prisma.course.findUniqueOrThrow({ where: { id: d.courseId } });
  const s = await prisma.session.create({ data: { ...d, teacherId: course.teacherId } });
  redirect(`/sessions/${s.id}`);
}

export async function changeSessionTeacher(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("sessionId"));
  const teacherId = String(fd.get("teacherId"));
  await prisma.session.update({ where: { id }, data: { teacherId } });
  redirect(`/sessions/${id}`);
}
