"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";
import { activateTeacherForClasse } from "@/lib/enrollment";

const STAFF = ["ADMIN", "DIRECTOR"] as const;

const classeSchema = z.object({
  name: z.string().trim().min(1).max(50),
  schoolYearId: z.string().min(1),
  roomNumber: z.string().trim().max(20).optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
});

/** Lit le formulaire : champs facultatifs vides => undefined. */
function readClasse(fd: FormData) {
  const opt = (k: string) => {
    const v = String(fd.get(k) ?? "").trim();
    return v === "" ? undefined : v;
  };
  return classeSchema.safeParse({
    name: fd.get("name"),
    schoolYearId: fd.get("schoolYearId"),
    roomNumber: opt("roomNumber"),
    capacity: opt("capacity"),
  });
}

const isUnique = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function createClasse(fd: FormData) {
  await requireUser([...STAFF]);
  const p = readClasse(fd);
  if (!p.success) fail("/classes", "validation");
  const sy = await prisma.schoolYear.findUnique({ where: { id: p.data.schoolYearId }, select: { id: true } });
  if (!sy) fail("/classes", "not_found");
  try {
    const c = await prisma.classe.create({
      data: {
        name: p.data.name,
        schoolYearId: p.data.schoolYearId,
        roomNumber: p.data.roomNumber ?? null,
        ...(p.data.capacity !== undefined ? { capacity: p.data.capacity } : {}),
      },
    });
    revalidatePath("/classes");
    done(`/classes/${c.id}`, "class_created");
  } catch (e) {
    if (isUnique(e)) fail("/classes", "class_exists");
    throw e;
  }
}

/** Les actions lancées depuis le tableau (champ from=list) reviennent à la liste des classes. */
const backTo = (fd: FormData, id: string) => (fd.get("from") === "list" ? "/classes" : `/classes/${id}`);

export async function updateClasse(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const back = backTo(fd, id);
  const editPage = fd.get("from") === "list" ? `/classes/${id}/edit` : back;
  const p = readClasse(fd);
  if (!p.success) fail(editPage, "validation");
  const sy = await prisma.schoolYear.findUnique({ where: { id: p.data.schoolYearId }, select: { id: true } });
  if (!sy) fail(editPage, "not_found");
  try {
    await prisma.classe.update({
      where: { id },
      data: {
        name: p.data.name,
        schoolYearId: p.data.schoolYearId,
        roomNumber: p.data.roomNumber ?? null,
        capacity: p.data.capacity ?? null,
      },
    });
  } catch (e) {
    if (isUnique(e)) fail(editPage, "class_exists");
    throw e;
  }
  revalidatePath("/classes");
  revalidatePath(`/classes/${id}`);
  done(back, "class_updated");
}

export async function deleteClasse(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const back = backTo(fd, id);
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
    const created = await prisma.course.create({
      data: { classeId, ...p.data },
      select: { teacherId: true, classe: { select: { schoolYearId: true } } },
    });
    await activateTeacherForClasse(prisma, created.teacherId, created.classe.schoolYearId);
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
  const course = await prisma.course.findUnique({
    where: { id },
    include: { classe: { select: { schoolYearId: true } } },
  });
  if (!course) fail("/classes", "not_found");
  const back = `/classes/${course.classeId}`;
  const p = courseSchema
    .pick({ teacherId: true, coefficient: true })
    .safeParse({ teacherId: fd.get("teacherId"), coefficient: fd.get("coefficient") });
  if (!p.success) fail(back, "validation");
  await prisma.course.update({ where: { id }, data: p.data });
  await activateTeacherForClasse(prisma, p.data.teacherId, course.classe.schoolYearId);
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
