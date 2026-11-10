import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BulletinRow = { id: string; name: string; avg: number | null; coefficient: number };

type GradeRow = Prisma.GradeGetPayload<{
  include: { assessment: { include: { course: { include: { subject: true } } } } };
}>;

/** Moyenne /20 par matière à partir de notes déjà chargées (calcul pur, sans requête). */
function summarize(rows: GradeRow[]): BulletinRow[] {
  const by = new Map<string, { name: string; total: number; count: number; coefficient: number }>();
  for (const row of rows) {
    if (row.score == null) continue;
    const key = row.assessment.course.subjectId;
    const current = by.get(key) ?? {
      name: row.assessment.course.subject.name,
      total: 0,
      count: 0,
      coefficient: row.assessment.course.coefficient,
    };
    current.total += (row.score / row.assessment.maxScore) * 20;
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

/** Moyenne /20 par matière pour un élève (sur une période si `termId` est fourni). */
export async function averageBySubject(studentId: string, termId?: string): Promise<BulletinRow[]> {
  const rows = await prisma.grade.findMany({
    where: { studentId, score: { not: null }, ...(termId ? { assessment: { termId } } : {}) },
    include: { assessment: { include: { course: { include: { subject: true } } } } },
  });
  return summarize(rows);
}

/** Toutes les données du bulletin : moyenne générale et moyennes par période (2 requêtes au total). */
export async function getBulletinData(studentId: string) {
  const [terms, grades] = await Promise.all([
    prisma.term.findMany({ orderBy: { startDate: "asc" } }),
    prisma.grade.findMany({
      where: { studentId, score: { not: null } },
      include: { assessment: { include: { course: { include: { subject: true } } } } },
    }),
  ]);
  const allSubjects = summarize(grades);
  const termSummaries = terms.map((term) => ({
    term,
    rows: summarize(grades.filter((g) => g.assessment.termId === term.id)),
  }));
  const overallAvg = allSubjects.length
    ? +(allSubjects.reduce((sum, r) => sum + (r.avg ?? 0), 0) / allSubjects.length).toFixed(2)
    : null;
  return { allSubjects, termSummaries, overallAvg };
}
