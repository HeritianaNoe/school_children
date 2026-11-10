"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { done, fail, forbidden } from "@/lib/flash";

const schema = z.object({
  body: z.string().min(1).max(2000),
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
});

export async function addComment(fd: FormData) {
  const user = await requireUser(["TEACHER", "ADMIN", "DIRECTOR"]);
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const p = schema.safeParse({
    body: raw.body?.trim(),
    studentId: raw.studentId || undefined,
    teacherId: raw.teacherId || undefined,
  });
  if (!p.success || (!p.data.studentId && !p.data.teacherId)) fail("/dashboard", "validation");
  const d = p.data;
  const path = d.studentId ? `/students/${d.studentId}/dossier` : `/teachers/${d.teacherId}`;
  if (d.teacherId && !isStaff(user.role)) forbidden(); // seule l'administration commente les enseignants
  await prisma.comment.create({ data: { ...d, authorId: user.id } });
  revalidatePath(path);
  done(path, "comment_added");
}
