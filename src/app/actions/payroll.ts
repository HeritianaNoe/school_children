"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { computeAllTeacherPay } from "@/lib/payroll";
import { done, fail } from "@/lib/flash";

export async function generatePayslips(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const month = String(fd.get("month"));
  if (!/^\d{4}-\d{2}$/.test(month)) fail("/payroll", "validation");
  // 3 requêtes au total (calcul de tous les enseignants + fiches existantes + écriture groupée)
  const [pay, existing] = await Promise.all([
    computeAllTeacherPay(month),
    prisma.payslip.findMany({ where: { month }, select: { teacherId: true, status: true } }),
  ]);
  const locked = new Set(existing.filter((e) => e.status !== "DRAFT").map((e) => e.teacherId)); // validée / payée : intouchable
  await prisma.$transaction(
    [...pay.entries()]
      .filter(([teacherId]) => !locked.has(teacherId))
      .map(([teacherId, r]) =>
        prisma.payslip.upsert({
          where: { teacherId_month: { teacherId, month } },
          create: { teacherId, month, totalMinutes: r.totalMinutes, hourlyRate: r.hourlyRate, gross: r.gross },
          update: { totalMinutes: r.totalMinutes, hourlyRate: r.hourlyRate, gross: r.gross },
        })
      )
  );
  revalidatePath("/payroll");
  done(`/payroll?month=${month}`, "payslips_generated");
}

export async function setPayslipStatus(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const status = String(fd.get("status"));
  if (!["DRAFT", "VALIDATED", "PAID"].includes(status)) fail("/payroll", "validation");
  const slip = await prisma.payslip.update({
    where: { id: String(fd.get("id")) },
    data: { status: status as "DRAFT" | "VALIDATED" | "PAID" },
  });
  revalidatePath("/payroll");
  done(`/payroll?month=${slip.month}`, "payslip_status");
}
