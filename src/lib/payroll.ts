import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { monthRange } from "./dates";

/**
 * Durée réellement enseignée = durée de la séance, bornée par l'heure
 * d'arrivée (arrivedAt) et l'heure de départ (leftAt) de l'enseignant si elles existent.
 * ABSENT / EXCUSED => 0 minute.
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

/**
 * Paie de TOUS les enseignants pour un mois, en 2 requêtes (au lieu de 2 par enseignant).
 * Retourne une Map teacherId → { totalMinutes, hourlyRate, gross }.
 */
export async function computeAllTeacherPay(month: string) {
  const { start, end } = monthRange(month);
  const [teachers, sessions] = await Promise.all([
    prisma.teacher.findMany({ select: { id: true, hourlyRate: true } }),
    prisma.session.findMany({
      where: { status: "DONE", startsAt: { gte: start, lt: end } },
      select: {
        teacherId: true,
        startsAt: true,
        endsAt: true,
        teacherAttendance: { select: { status: true, arrivedAt: true, leftAt: true } },
      },
    }),
  ]);

  const minutes = new Map<string, number>();
  for (const s of sessions) {
    const m = effectiveMinutes({ startsAt: s.startsAt, endsAt: s.endsAt, att: s.teacherAttendance });
    minutes.set(s.teacherId, (minutes.get(s.teacherId) ?? 0) + m);
  }

  const out = new Map<string, { totalMinutes: number; hourlyRate: Prisma.Decimal; gross: Prisma.Decimal }>();
  for (const t of teachers) {
    const totalMinutes = minutes.get(t.id) ?? 0;
    const gross = new Prisma.Decimal(t.hourlyRate).mul(totalMinutes).div(60).toDecimalPlaces(0);
    out.set(t.id, { totalMinutes, hourlyRate: t.hourlyRate, gross });
  }
  return out;
}

export async function generatePayslip(teacherId: string, month: string) {
  const r = await computeTeacherPay(teacherId, month);
  return prisma.payslip.upsert({
    where: { teacherId_month: { teacherId, month } },
    create: { teacherId, month, totalMinutes: r.totalMinutes, hourlyRate: r.hourlyRate, gross: r.gross },
    update: { totalMinutes: r.totalMinutes, hourlyRate: r.hourlyRate, gross: r.gross },
  });
}
