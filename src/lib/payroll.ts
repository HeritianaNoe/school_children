import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { monthRange } from "./dates";

/**
 * Ora tena nampianarana = fe-potoana ny séance, voafetra amin'ny
 * fahatongavan'ny prof (arrivedAt) sy ny fialany (leftAt) raha misy.
 * ABSENT / EXCUSED => 0 minitra.
 */
export function effectiveMinutes(s: {
  startsAt: Date;
  endsAt: Date;
  att: { status: string; arrivedAt: Date | null; leftAt: Date | null } | null;
}) {
  if (!s.att || s.att.status === "ABSENT" || s.att.status === "EXCUSED") return 0;
  const from = s.att.arrivedAt && s.att.arrivedAt > s.startsAt ? s.att.arrivedAt : s.startsAt;
  const to = s.att.leftAt && s.att.leftAt < s.endsAt ? s.att.leftAt : s.endsAt;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
}

export async function computeTeacherPay(teacherId: string, month: string) {
  const { start, end } = monthRange(month);
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });

  const sessions = await prisma.session.findMany({
    where: { teacherId, status: "DONE", startsAt: { gte: start, lt: end } },
    include: { teacherAttendance: true },
  });

  const totalMinutes = sessions.reduce(
    (sum, s) =>
      sum + effectiveMinutes({ startsAt: s.startsAt, endsAt: s.endsAt, att: s.teacherAttendance }),
    0
  );
  const gross = new Prisma.Decimal(teacher.hourlyRate).mul(totalMinutes).div(60).toDecimalPlaces(0);
  return { totalMinutes, hourlyRate: teacher.hourlyRate, gross };
}

export async function generatePayslip(teacherId: string, month: string) {
  const r = await computeTeacherPay(teacherId, month);
  return prisma.payslip.upsert({
    where: { teacherId_month: { teacherId, month } },
    create: { teacherId, month, totalMinutes: r.totalMinutes, hourlyRate: r.hourlyRate, gross: r.gross },
    update: { totalMinutes: r.totalMinutes, hourlyRate: r.hourlyRate, gross: r.gross },
  });
}
