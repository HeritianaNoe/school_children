"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generatePayslip } from "@/lib/payroll";
import { done, fail } from "@/lib/flash";

export async function generatePayslips(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const month = String(fd.get("month"));
  if (!/^\d{4}-\d{2}$/.test(month)) fail("/payroll", "validation");
  const teachers = await prisma.teacher.findMany({ select: { id: true } });
  for (const t of teachers) {
    const existing = await prisma.payslip.findUnique({
      where: { teacherId_month: { teacherId: t.id, month } },
    });
    if (existing && existing.status !== "DRAFT") continue; // une fiche validée ou payée n'est plus modifiée
    await generatePayslip(t.id, month);
  }
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
