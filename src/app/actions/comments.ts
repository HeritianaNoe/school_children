"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";

const schema = z.object({
  body: z.string().min(1).max(2000),
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
});

export async function addComment(fd: FormData) {
  const user = await requireUser(["TEACHER", "ADMIN", "DIRECTOR"]);
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const d = schema.parse({
    body: raw.body,
    studentId: raw.studentId || undefined,
    teacherId: raw.teacherId || undefined,
  });
  if (!d.studentId && !d.teacherId) throw new Error("Cible manquante");
  if (d.teacherId && !isStaff(user.role)) throw new Error("Forbidden"); // admin ihany no manoratra momba ny prof
  await prisma.comment.create({ data: { ...d, authorId: user.id } });
  revalidatePath(d.studentId ? `/students/${d.studentId}` : `/teachers/${d.teacherId}`);
}
