"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";

const STAFF = ["ADMIN", "DIRECTOR"] as const;
const PAGE = "/school-years";

/** Colonnes DATE (sans heure) : on les manipule en UTC pour éviter tout décalage de jour lié au fuseau. */
const parseDay = (s: string) => new Date(`${s}T00:00:00.000Z`);

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const schema = z.object({
  name: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/)
    .refine((y) => Number(y.slice(5)) === Number(y.slice(0, 4)) + 1),
  startDate: dateStr,
  endDate: dateStr,
  status: z.enum(["UPCOMING", "ACTIVE", "CLOSED", "ARCHIVED"]),
});

const isUnique = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

function read(fd: FormData) {
  return schema.safeParse({
    name: fd.get("name"),
    startDate: fd.get("startDate"),
    endDate: fd.get("endDate"),
    status: fd.get("status") || "UPCOMING",
  });
}

/** Une année clôturée ou archivée ne peut pas rester « courante ». */
const canBeCurrent = (status: string) => status === "UPCOMING" || status === "ACTIVE";

export async function createSchoolYear(fd: FormData) {
  await requireUser([...STAFF]);
  const p = read(fd);
  if (!p.success) fail(PAGE, "validation");
  const d = p.data;
  const start = parseDay(d.startDate);
  const end = parseDay(d.endDate);
  if (end <= start) fail(PAGE, "school_year_dates");

  const makeCurrent = fd.get("isCurrent") === "on";
  if (makeCurrent && !canBeCurrent(d.status)) fail(PAGE, "school_year_not_open");

  try {
    await prisma.$transaction(async (tx) => {
      // L'index unique partiel n'autorise qu'une année courante : on retire l'ancienne d'abord.
      if (makeCurrent) await tx.schoolYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      await tx.schoolYear.create({
        data: {
          name: d.name,
          startDate: start,
          endDate: end,
          status: d.status,
          isCurrent: makeCurrent,
        },
      });
    });
  } catch (e) {
    if (isUnique(e)) fail(PAGE, "school_year_exists");
    throw e;
  }
  revalidatePath(PAGE);
  revalidatePath("/classes");
  done(PAGE, "school_year_created");
}

export async function updateSchoolYear(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const current = await prisma.schoolYear.findUnique({ where: { id } });
  if (!current) fail(PAGE, "not_found");

  const p = read(fd);
  if (!p.success) fail(PAGE, "validation");
  const d = p.data;
  const start = parseDay(d.startDate);
  const end = parseDay(d.endDate);
  if (end <= start) fail(PAGE, "school_year_dates");

  try {
    await prisma.schoolYear.update({
      where: { id },
      data: {
        name: d.name,
        startDate: start,
        endDate: end,
        status: d.status,
        // Si l'année passe en CLOSED / ARCHIVED, elle cesse d'être l'année courante.
        ...(canBeCurrent(d.status) ? {} : { isCurrent: false }),
      },
    });
  } catch (e) {
    if (isUnique(e)) fail(PAGE, "school_year_exists");
    throw e;
  }
  revalidatePath(PAGE);
  revalidatePath("/classes");
  done(PAGE, "school_year_updated");
}

/** Définit l'année courante (une seule à la fois) et la passe en ACTIVE. */
export async function setCurrentSchoolYear(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const sy = await prisma.schoolYear.findUnique({ where: { id } });
  if (!sy) fail(PAGE, "not_found");
  if (!canBeCurrent(sy.status)) fail(PAGE, "school_year_not_open");

  await prisma.$transaction([
    prisma.schoolYear.updateMany({ where: { isCurrent: true, NOT: { id } }, data: { isCurrent: false } }),
    prisma.schoolYear.update({ where: { id }, data: { isCurrent: true, status: "ACTIVE" } }),
  ]);
  revalidatePath(PAGE);
  revalidatePath("/classes");
  done(PAGE, "school_year_current");
}

export async function deleteSchoolYear(fd: FormData) {
  await requireUser([...STAFF]);
  const id = String(fd.get("id") ?? "");
  const classes = await prisma.classe.count({ where: { schoolYearId: id } });
  if (classes > 0) fail(PAGE, "school_year_has_classes");
  await prisma.schoolYear.delete({ where: { id } });
  revalidatePath(PAGE);
  done(PAGE, "school_year_deleted");
}
