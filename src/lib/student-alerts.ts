import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Étiquette de cache : à invalider quand des notes ou des présences changent. */
export const STUDENT_ALERTS_TAG = "student-alerts";

/** Seuils des alertes de la cloche (modifiables ici). */
export const ALERT_LIMITS = {
  /** Note ramenée sur 20 strictement inférieure à cette valeur. */
  LOW_GRADE_BELOW: 5,
  /** Nombre de jours d'absence (jours différents) strictement dépassé. */
  ABSENT_DAYS_OVER: 3,
  /** Fenêtre de calcul des absences, en jours. */
  ABSENT_WINDOW_DAYS: 30,
} as const;

export type LowGradeAlert = { studentId: string; name: string; classe: string; count: number; lowest: number };
export type AbsenceAlert = { studentId: string; name: string; classe: string; days: number };
export type StudentAlerts = { lowGrades: LowGradeAlert[]; absences: AbsenceAlert[] };

/**
 * Élèves ayant au moins une note < 5/20 (année scolaire courante) et élèves absents plus de 3 jours
 * sur les 30 derniers jours. Deux requêtes SQL groupées, résultat mis en cache (invalidé à chaque
 * saisie de notes / de présences, sinon recalculé toutes les 2 minutes).
 */
export const getStudentAlerts = unstable_cache(
  async (): Promise<StudentAlerts> => {
    try {
      const since = new Date(Date.now() - ALERT_LIMITS.ABSENT_WINDOW_DAYS * 86400_000);

      const [grades, absent] = await Promise.all([
        prisma.$queryRaw<{ studentId: string; n: number; lowest: number }[]>(Prisma.sql`
          SELECT g."studentId" AS "studentId", COUNT(*)::int AS n,
                 MIN(g.score / a."maxScore" * 20)::float8 AS lowest
          FROM "Grade" g
          JOIN "Assessment" a ON a.id = g."assessmentId"
          JOIN terms t ON t.id = a."termId"
          JOIN school_years sy ON sy.id = t.school_year_id
          WHERE g.score IS NOT NULL AND a."maxScore" > 0
            AND g.score / a."maxScore" * 20 < ${ALERT_LIMITS.LOW_GRADE_BELOW}
            AND (sy.is_current OR NOT EXISTS (SELECT 1 FROM school_years WHERE is_current))
          GROUP BY g."studentId"
          ORDER BY lowest ASC
          LIMIT 100`),
        prisma.$queryRaw<{ studentId: string; days: number }[]>(Prisma.sql`
          SELECT sa."studentId" AS "studentId", COUNT(DISTINCT DATE(s."startsAt"))::int AS days
          FROM "StudentAttendance" sa
          JOIN "Session" s ON s.id = sa."sessionId"
          WHERE sa.status = 'ABSENT' AND s."startsAt" >= ${since} AND s."startsAt" <= NOW()
          GROUP BY sa."studentId"
          HAVING COUNT(DISTINCT DATE(s."startsAt")) > ${ALERT_LIMITS.ABSENT_DAYS_OVER}
          ORDER BY days DESC
          LIMIT 100`),
      ]);

      const ids = [...new Set([...grades.map((g) => g.studentId), ...absent.map((a) => a.studentId)])];
      if (ids.length === 0) return { lowGrades: [], absences: [] };
      const students = await prisma.student.findMany({
        where: { id: { in: ids } },
        select: { id: true, firstName: true, lastName: true, classe: { select: { name: true } } },
      });
      const byId = new Map(students.map((s) => [s.id, s]));
      const label = (id: string) => {
        const s = byId.get(id);
        return s ? { name: `${s.lastName.toUpperCase()} ${s.firstName}`, classe: s.classe.name } : null;
      };

      const lowGrades = grades.flatMap((g) => {
        const l = label(g.studentId);
        return l ? [{ studentId: g.studentId, ...l, count: g.n, lowest: Math.round(g.lowest * 10) / 10 }] : [];
      });
      const absences = absent.flatMap((a) => {
        const l = label(a.studentId);
        return l ? [{ studentId: a.studentId, ...l, days: a.days }] : [];
      });
      return { lowGrades, absences };
    } catch {
      return { lowGrades: [], absences: [] };
    }
  },
  ["student-alerts:v1"],
  { tags: [STUDENT_ALERTS_TAG], revalidate: 120 }
);
