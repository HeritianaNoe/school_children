import { prisma } from "./prisma";
import { averagesByTerm } from "./grades";

/** Fenêtre de calcul des présences affichées dans le dossier. */
export const ATTENDANCE_DAYS = 30;

/**
 * Données du dossier d'un élève : présences (30 derniers jours), moyennes par période, notes
 * et commentaires. Partagé par la page `/students/[id]/dossier` et par son PDF.
 * Les commentaires ne sont chargés que pour le personnel (`withComments`).
 */
export async function loadDossier(studentId: string, withComments: boolean) {
  const since = new Date(Date.now() - ATTENDANCE_DAYS * 86400_000);

  const [att, terms, grades, comments] = await Promise.all([
    prisma.studentAttendance.groupBy({
      by: ["status"],
      where: { studentId, session: { startsAt: { gte: since } } },
      _count: { _all: true },
    }),
    prisma.term.findMany({ orderBy: { startDate: "asc" } }),
    prisma.grade.findMany({
      where: { studentId },
      orderBy: { assessment: { date: "desc" } },
      include: { assessment: { include: { course: { include: { subject: true } } } } },
    }),
    withComments
      ? prisma.comment.findMany({
          where: { studentId },
          orderBy: { createdAt: "desc" },
          include: { author: true },
        })
      : Promise.resolve([]),
  ]);

  const count = (k: string) => att.find((a) => a.status === k)?._count._all ?? 0;
  const attendance = {
    present: count("PRESENT"),
    late: count("LATE"),
    absent: count("ABSENT"),
    excused: count("EXCUSED"),
  };
  const avgByTerm = averagesByTerm(grades, terms.map((t) => t.id));
  const averages = terms.map((t) => ({ t, avg: avgByTerm.get(t.id) ?? null }));

  return { attendance, averages, grades, comments };
}
