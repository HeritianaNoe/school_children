import { prisma } from "./prisma";

// Salan'isa /20 : isaky ny matière (coef ny évaluation) avy eo ankapobeny (coef ny matière)
export async function studentAverage(studentId: string, termId: string) {
  const grades = await prisma.grade.findMany({
    where: { studentId, score: { not: null }, assessment: { termId } },
    include: { assessment: { include: { course: true } } },
  });
  const by = new Map<string, { num: number; den: number; coef: number }>();
  for (const g of grades) {
    const k = g.assessment.courseId;
    const v = by.get(k) ?? { num: 0, den: 0, coef: g.assessment.course.coefficient };
    const w = g.assessment.coefficient;
    v.num += (g.score! / g.assessment.maxScore) * 20 * w;
    v.den += w;
    by.set(k, v);
  }
  let n = 0, d = 0;
  for (const v of by.values()) {
    n += (v.num / v.den) * v.coef;
    d += v.coef;
  }
  return d ? +(n / d).toFixed(2) : null;
}
