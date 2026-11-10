import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/** « 2026-2027 » + enseignant → « CT-2026-2027-A1B2C3 » */
export const contractNumber = (yearName: string, teacherId: string) =>
  `CT-${yearName}-${teacherId.slice(-6).toUpperCase()}`;

/**
 * Renouvellement annuel : crée le contrat de l'année pour chaque enseignant qui n'en a pas encore.
 * Le taux horaire et le statut sont figés à cet instant. Les contrats existants ne sont jamais écrasés.
 * Deux requêtes de lecture + une écriture groupée, quel que soit le nombre d'enseignants.
 */
export async function ensureContractsForYear(db: Db, schoolYearId: string) {
  const year = await db.schoolYear.findUnique({ where: { id: schoolYearId } });
  if (!year) return 0;
  const [teachers, existing] = await Promise.all([
    db.teacher.findMany({ select: { id: true, hourlyRate: true, status: true } }),
    db.teacherContract.findMany({ where: { schoolYearId }, select: { teacherId: true } }),
  ]);
  const have = new Set(existing.map((c) => c.teacherId));
  const data = teachers
    .filter((t) => !have.has(t.id))
    .map((t) => ({
      teacherId: t.id,
      schoolYearId,
      number: contractNumber(year.name, t.id),
      startDate: year.startDate,
      endDate: year.endDate,
      hourlyRate: t.hourlyRate,
      status: t.status,
    }));
  if (data.length > 0) await db.teacherContract.createMany({ data, skipDuplicates: true });
  return data.length;
}

/** Génère ou actualise le contrat d'un enseignant pour une année (taux, statut et dates repris à jour). */
export async function refreshContract(db: Db, teacherId: string, schoolYearId: string) {
  const [teacher, year] = await Promise.all([
    db.teacher.findUniqueOrThrow({ where: { id: teacherId } }),
    db.schoolYear.findUniqueOrThrow({ where: { id: schoolYearId } }),
  ]);
  const values = {
    startDate: year.startDate,
    endDate: year.endDate,
    hourlyRate: teacher.hourlyRate,
    status: teacher.status,
  };
  return db.teacherContract.upsert({
    where: { teacherId_schoolYearId: { teacherId, schoolYearId } },
    create: { teacherId, schoolYearId, number: contractNumber(year.name, teacherId), ...values },
    update: values,
  });
}
