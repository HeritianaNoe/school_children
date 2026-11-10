"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { refreshContract } from "@/lib/contracts";
import { done, fail } from "@/lib/flash";

/** Génère (ou actualise avec le taux horaire et le statut actuels) le contrat de l'année courante. */
export async function renewContract(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const teacherId = String(fd.get("teacherId") ?? "");
  const back = `/teachers/${teacherId}/contract`;

  const [teacher, current] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }),
    prisma.schoolYear.findFirst({ where: { isCurrent: true }, select: { id: true } }),
  ]);
  if (!teacher) fail("/teachers", "not_found");
  if (!current) fail(back, "no_current_year");

  await refreshContract(prisma, teacher.id, current.id);
  revalidatePath(back);
  revalidatePath(`/teachers/${teacherId}`);
  done(back, "contract_renewed");
}
