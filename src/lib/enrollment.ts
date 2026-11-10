import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Règle métier : un compte élève n'est actif que pour l'année scolaire où l'élève est inscrit.
 *
 * Quand une nouvelle année devient l'année courante :
 *  - tous les comptes élèves rattachés à une AUTRE année sont désactivés ;
 *  - les comptes des élèves déjà inscrits dans cette année (pré-inscriptions) sont activés.
 * Un élève qui revient doit donc être réinscrit (changement de classe vers l'année courante),
 * ce qui réactive son compte (voir updateStudent).
 *
 * Deux requêtes SQL seulement, quel que soit le nombre d'élèves.
 */
export async function syncStudentAccountsForYear(db: Db, schoolYearId: string) {
  const off = await db.user.updateMany({
    where: {
      role: "STUDENT",
      active: true,
      student: { is: { classe: { schoolYearId: { not: schoolYearId } } } },
    },
    data: { active: false },
  });
  const on = await db.user.updateMany({
    where: {
      role: "STUDENT",
      active: false,
      student: { is: { classe: { schoolYearId } } },
    },
    data: { active: true },
  });
  return { deactivated: off.count, activated: on.count };
}

/**
 * Même règle pour les enseignants : un compte enseignant n'est actif que pour l'année où il a au moins
 * un enseignement (Course) dans une classe. À la création d'une année courante (sans classes encore),
 * tous les comptes enseignants sont donc désactivés ; ils sont réactivés dès qu'une matière leur est
 * affectée dans une classe de cette année (voir addCourse / updateCourse).
 * Les comptes ADMIN, DIRECTOR et MANAGER ne sont jamais touchés.
 */
export async function syncTeacherAccountsForYear(db: Db, schoolYearId: string) {
  const off = await db.user.updateMany({
    where: {
      role: "TEACHER",
      active: true,
      teacher: { is: { courses: { none: { classe: { schoolYearId } } } } },
    },
    data: { active: false },
  });
  const on = await db.user.updateMany({
    where: {
      role: "TEACHER",
      active: false,
      teacher: { is: { courses: { some: { classe: { schoolYearId } } } } },
    },
    data: { active: true },
  });
  return { deactivated: off.count, activated: on.count };
}

/** Affectation d'une matière : le compte de l'enseignant redevient actif si la classe est dans l'année courante. */
export async function activateTeacherForClasse(db: Db, teacherId: string, classeSchoolYearId: string) {
  if (!(await accountShouldBeActive(db, classeSchoolYearId))) return;
  await db.user.updateMany({
    where: { role: "TEACHER", active: false, teacher: { is: { id: teacherId } } },
    data: { active: true },
  });
}

/**
 * Le compte d'un élève inscrit dans une classe de cette année doit-il être actif ?
 * Oui si c'est l'année courante (ou s'il n'y a aucune année courante définie).
 */
export async function accountShouldBeActive(db: Db, classeSchoolYearId: string) {
  const current = await db.schoolYear.findFirst({ where: { isCurrent: true }, select: { id: true } });
  return !current || current.id === classeSchoolYearId;
}
