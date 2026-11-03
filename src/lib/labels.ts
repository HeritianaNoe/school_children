// Libellés français des valeurs techniques (enums Prisma) affichées dans l'interface
export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  DIRECTOR: "Directeur",
  MANAGER: "Manager",
  TEACHER: "Enseignant",
  STUDENT: "Élève",
};

export const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENT: "Présent",
  LATE: "En retard",
  ABSENT: "Absent",
  EXCUSED: "Justifié",
};

export const SESSION_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planifiée",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

export const ASSESSMENT_TYPE_LABEL: Record<string, string> = {
  HOMEWORK: "Devoir",
  TEST: "Interrogation",
  EXAM: "Examen",
};

export const PAYSLIP_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  VALIDATED: "Validée",
  PAID: "Payée",
};

export const SEX_LABEL: Record<string, string> = { M: "Garçon", F: "Fille" };
export const SEX_LABEL_LONG: Record<string, string> = { M: "Masculin", F: "Féminin" };
