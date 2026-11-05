"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parseDateInput } from "@/lib/format";
import { done, fail } from "@/lib/flash";

const termSchema = z.object({
  name: z.string().trim().min(1).max(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schoolYearId: z.string().min(1),
});

function read(fd: FormData) {
  return termSchema.safeParse({
    name: fd.get("name"),
    startDate: fd.get("startDate"),
    endDate: fd.get("endDate"),
    schoolYearId: fd.get("schoolYearId"),
  });
}

export async function createTerm(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const p = read(fd);
  if (!p.success) fail("/terms", "validation");
  if (p.data.endDate < p.data.startDate) fail("/terms", "term_dates");

  const year = await prisma.schoolYear.findUnique({ where: { id: p.data.schoolYearId } });
  if (!year) fail("/terms", "not_found");

  await prisma.term.create({
    data: {
      name: p.data.name,
      startDate: parseDateInput(p.data.startDate),
      endDate: parseDateInput(p.data.endDate),
      schoolYearId: p.data.schoolYearId,
    },
  });
  revalidatePath("/terms");
  done("/terms", "term_created");
}

export async function updateTerm(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("id") ?? "");
  const p = read(fd);
  if (!p.success) fail("/terms", "validation");
  if (p.data.endDate < p.data.startDate) fail("/terms", "term_dates");

  const year = await prisma.schoolYear.findUnique({ where: { id: p.data.schoolYearId } });
  if (!year) fail("/terms", "not_found");

  await prisma.term.update({
    where: { id },
    data: {
      name: p.data.name,
      startDate: parseDateInput(p.data.startDate),
      endDate: parseDateInput(p.data.endDate),
      schoolYearId: p.data.schoolYearId,
    },
  });
  revalidatePath("/terms");
  done("/terms", "term_updated");
}

export async function deleteTerm(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("id") ?? "");
  const used = await prisma.assessment.count({ where: { termId: id } });
  if (used > 0) fail("/terms", "term_in_use");
  await prisma.term.delete({ where: { id } });
  revalidatePath("/terms");
  done("/terms", "term_deleted");
}
