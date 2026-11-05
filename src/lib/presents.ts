import { prisma } from "@/lib/prisma";
import { toDateInput } from "@/lib/format";

/** Jour demandé (AAAA-MM-JJ) : aujourd'hui si la valeur est absente ou invalide. */
export function parseDay(value?: string | null) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? (value as string) : toDateInput(new Date());
}

/** Séances d'un jour (et d'une classe, facultatif) avec les élèves venus en classe : présents ou en retard. */
export async function getPresents(day: string, classeId?: string, sessionId?: string) {
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const sessions = await prisma.session.findMany({
    where: {
      startsAt: { gte: start, lt: end },
      ...(sessionId ? { id: sessionId } : {}),
      // Seules les classes qui ont au moins un élève sont concernées
      course: { ...(classeId ? { classeId } : {}), classe: { students: { some: {} } } },
    },
    orderBy: { startsAt: "asc" },
    include: {
      course: { include: { classe: { include: { schoolYear: true } }, subject: true, teacher: { include: { user: true } } } },
      teacher: { include: { user: true } },
      studentAttendance: {
        where: { status: { in: ["PRESENT", "LATE"] } },
        include: { student: { select: { id: true, firstName: true, lastName: true, sex: true, photoUrl: true } } },
      },
      _count: { select: { studentAttendance: true } },
    },
  });

  const sortByName = (
    a: { student: { lastName: string; firstName: string } },
    b: { student: { lastName: string; firstName: string } }
  ) =>
    `${a.student.lastName} ${a.student.firstName}`.localeCompare(`${b.student.lastName} ${b.student.firstName}`, "fr");

  return {
    start,
    sessions: sessions.map((s) => ({
      ...s,
      called: s._count.studentAttendance > 0,
      // Remplacement : l'enseignant de la séance n'est pas le titulaire du cours
      replacedTeacher: s.teacherId !== s.course.teacherId ? s.course.teacher.user.name : null,
      present: [...s.studentAttendance].sort(sortByName),
    })),
  };
}
