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

// Nomenclature d'inscription (champ Student.nomenclature)
export const NOMENCLATURE_LABEL: Record<string, string> = {
  NEW: "Nouveau",
  PROMOTED: "Passant",
  REPEATER: "Redoublant",
  TRANSFERRED: "Transféré",
};
export const NOMENCLATURE_VALUES = ["NEW", "PROMOTED", "REPEATER", "TRANSFERRED"] as const;

export const SCHOOL_YEAR_STATUS_LABEL: Record<string, string> = {
  UPCOMING: "À venir",
  ACTIVE: "Active",
  CLOSED: "Clôturée",
  ARCHIVED: "Archivée",
};
export const SCHOOL_YEAR_STATUS_VALUES = ["UPCOMING", "ACTIVE", "CLOSED", "ARCHIVED"] as const;

export const TEACHER_STATUS_LABEL: Record<string, string> = {
  TITULAIRE: "Titulaire",
  CONTRACTUEL: "Contractuel",
  VACATAIRE: "Vacataire",
  PERMANENT: "Permanent",
  STAGIAIRE: "Stagiaire",
};
export const TEACHER_STATUS_VALUES = ["TITULAIRE", "CONTRACTUEL", "VACATAIRE", "PERMANENT", "STAGIAIRE"] as const;
