"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";

const STAFF = ["ADMIN", "DIRECTOR"] as const;

const classeSchema = z.object({
  name: z.string().trim().min(1).max(60),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/)
    .refine((y) => Number(y.slice(5)) === Number(y.slice(0, 4)) + 1),
});

const isUnique = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function createClasse(fd: FormData) {
  await requireUser([...STAFF]);
  const p = classeSchema.safeParse({ name: fd.get("name"), year: fd.get("year") });
  if (!p.success) fail("/classes", "validation");
  try {
    const c = await prisma.classe.create({ data: p.data });
    revalidatePath("/classes");
    done(`/classes/${c.id}`, "class_created");
  } catch (e) {
    if (isUnique(e)) fail("/classes", "class_exists");
    throw e;
  }
}

export async function updateClasse(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const back = `/classes/${id}`;
  const p = classeSchema.safeParse({ name: fd.get("name"), year: fd.get("year") });
  if (!p.success) fail(back, "validation");
  try {
    await prisma.classe.update({ where: { id }, data: p.data });
  } catch (e) {
    if (isUnique(e)) fail(back, "class_exists");
    throw e;
  }
  revalidatePath("/classes");
  revalidatePath(back);
  done(back, "class_updated");
}

export async function deleteClasse(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const back = `/classes/${id}`;
  const students = await prisma.student.count({ where: { classeId: id } });
  if (students > 0) fail(back, "class_has_students");
  const activity =
    (await prisma.session.count({ where: { course: { classeId: id } } })) +
    (await prisma.assessment.count({ where: { course: { classeId: id } } }));
  if (activity > 0) fail(back, "class_has_activity");

  await prisma.$transaction([
    prisma.course.deleteMany({ where: { classeId: id } }),
    prisma.classe.delete({ where: { id } }),
  ]);
  revalidatePath("/classes");
  done("/classes", "class_deleted");
}

// ───────── Enseignements (matière d'une classe, avec son enseignant et son coefficient) ─────────
const courseSchema = z.object({
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  coefficient: z.coerce.number().positive().max(100),
});

export async function addCourse(fd: FormData) {
  await requireUser([...STAFF]);
  const classeId = String(fd.get("classeId") ?? "");
  const back = `/classes/${classeId}`;
  const p = courseSchema.safeParse({
    subjectId: fd.get("subjectId"),
    teacherId: fd.get("teacherId"),
    coefficient: fd.get("coefficient"),
  });
  if (!p.success) fail(back, "validation");
  try {
    await prisma.course.create({ data: { classeId, ...p.data } });
  } catch (e) {
    if (isUnique(e)) fail(back, "course_exists");
    throw e;
  }
  revalidatePath(back);
  done(back, "course_added");
}

export async function updateCourse(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) fail("/classes", "not_found");
  const back = `/classes/${course.classeId}`;
  const p = courseSchema
    .pick({ teacherId: true, coefficient: true })
    .safeParse({ teacherId: fd.get("teacherId"), coefficient: fd.get("coefficient") });
  if (!p.success) fail(back, "validation");
  await prisma.course.update({ where: { id }, data: p.data });
  revalidatePath(back);
  done(back, "course_updated");
}

export async function deleteCourse(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) fail("/classes", "not_found");
  const back = `/classes/${course.classeId}`;
  const used =
    (await prisma.session.count({ where: { courseId: id } })) +
    (await prisma.assessment.count({ where: { courseId: id } }));
  if (used > 0) fail(back, "course_in_use");
  await prisma.course.delete({ where: { id } });
  revalidatePath(back);
  done(back, "course_removed");
}
