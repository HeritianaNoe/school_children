"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";

const subjectSchema = z.object({ name: z.string().trim().min(2).max(80) });

const isUnique = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function createSubject(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const p = subjectSchema.safeParse({ name: fd.get("name") });
  if (!p.success) fail("/subjects", "validation");
  try {
    await prisma.subject.create({ data: p.data });
  } catch (e) {
    if (isUnique(e)) fail("/subjects", "subject_exists");
    throw e;
  }
  revalidatePath("/subjects");
  done("/subjects", "subject_created");
}

export async function updateSubject(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("id") ?? "");
  const p = subjectSchema.safeParse({ name: fd.get("name") });
  if (!p.success) fail("/subjects", "validation");
  try {
    await prisma.subject.update({ where: { id }, data: p.data });
  } catch (e) {
    if (isUnique(e)) fail("/subjects", "subject_exists");
    throw e;
  }
  revalidatePath("/subjects");
  done("/subjects", "subject_updated");
}

export async function deleteSubject(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("id") ?? "");
  const used = await prisma.course.count({ where: { subjectId: id } });
  if (used > 0) fail("/subjects", "subject_in_use");
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/subjects");
  done("/subjects", "subject_deleted");
}
