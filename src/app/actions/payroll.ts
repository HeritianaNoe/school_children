"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generatePayslip } from "@/lib/payroll";

export async function generatePayslips(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const month = String(fd.get("month"));
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Volana tsy mety");
  const teachers = await prisma.teacher.findMany({ select: { id: true } });
  for (const t of teachers) {
    const existing = await prisma.payslip.findUnique({
      where: { teacherId_month: { teacherId: t.id, month } },
    });
    if (existing && existing.status !== "DRAFT") continue; // tsy ovaina intsony
    await generatePayslip(t.id, month);
  }
  revalidatePath("/payroll");
}

export async function setPayslipStatus(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const status = String(fd.get("status"));
  if (!["DRAFT", "VALIDATED", "PAID"].includes(status)) throw new Error("Status");
  await prisma.payslip.update({
    where: { id: String(fd.get("id")) },
    data: { status: status as "DRAFT" | "VALIDATED" | "PAID" },
  });
  revalidatePath("/payroll");
}
