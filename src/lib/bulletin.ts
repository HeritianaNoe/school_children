import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BulletinRow = { id: string; name: string; avg: number | null; coefficient: number };

/** Moyenne /20 par matière pour un élève (sur une période si `termId` est fourni). */
export async function averageBySubject(studentId: string, termId?: string): Promise<BulletinRow[]> {
  const where: Prisma.GradeWhereInput = {
    studentId,
    score: { not: null },
    ...(termId ? { assessment: { termId } } : {}),
  };

  const rows = await prisma.grade.findMany({
    where,
    include: {
      assessment: {
        include: {
          course: { include: { subject: true } },
        },
      },
    },
  });

  const by = new Map<string, { name: string; total: number; count: number; coefficient: number }>();
  for (const row of rows) {
    const key = row.assessment.course.subjectId;
    const current = by.get(key) ?? {
      name: row.assessment.course.subject.name,
      total: 0,
      count: 0,
      coefficient: row.assessment.course.coefficient,
    };
    current.total += (row.score! / row.assessment.maxScore) * 20;
    current.count += 1;
    by.set(key, current);
  }

  return [...by.entries()].map(([id, value]) => ({
    id,
    name: value.name,
    avg: value.count ? +(value.total / value.count).toFixed(2) : null,
    coefficient: value.coefficient,
  }));
}

/** Toutes les données du bulletin : moyenne générale et moyennes par période. */
export async function getBulletinData(studentId: string) {
  const terms = await prisma.term.findMany({ orderBy: { startDate: "asc" } });
  const allSubjects = await averageBySubject(studentId);
  const termSummaries = await Promise.all(
    terms.map(async (term) => ({ term, rows: await averageBySubject(studentId, term.id) }))
  );
  const overallAvg = allSubjects.length
    ? +(allSubjects.reduce((sum, r) => sum + (r.avg ?? 0), 0) / allSubjects.length).toFixed(2)
    : null;
  return { allSubjects, termSummaries, overallAvg };
}
