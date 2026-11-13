import type { Role } from "@prisma/client";

/**
 * Source unique des groupes de rôles. À utiliser dans les pages, les actions
 * et le menu, afin que ce que l'on affiche corresponde toujours à ce que l'on autorise.
 */
export const ROLES = {
  /** Administration complète (gestion des utilisateurs, classes, périodes…) */
  STAFF: ["ADMIN", "DIRECTOR", "MANAGER"] as const,
  /** Direction : peut écrire sur les données pédagogiques */
  DIRECTION: ["ADMIN", "DIRECTOR"] as const,
  /** Pédagogie : élèves, matières, notes, séances, paie (consultation enseignant) */
  PEDAGOGY: ["ADMIN", "DIRECTOR", "TEACHER"] as const,
} as const satisfies Record<string, readonly Role[]>;

export const hasRole = (role: Role, group: readonly Role[]) => group.includes(role);

/** Rôles affichés dans la matrice d'accès (pas les élèves). */
export const STAFF_ROLES: Role[] = ["ADMIN", "DIRECTOR", "MANAGER", "TEACHER"];

/** Modules gérés dans Paramètres → Accès du personnel. */
export const ACCESS_RESOURCES = [
  { key: "dashboard", label: "Tableau de bord", href: "/dashboard" },
  { key: "timetable", label: "Emploi du temps", href: "/timetable" },
  { key: "presents", label: "Élèves présents", href: "/presents" },
  { key: "announcements", label: "Annonces", href: "/announcements" },
  { key: "reclamations", label: "Réclamations", href: "/reclamations" },
  { key: "school-years", label: "Années scolaires", href: "/school-years" },
  { key: "classes", label: "Classes", href: "/classes" },
  { key: "students", label: "Élèves", href: "/students" },
  { key: "subjects", label: "Matières", href: "/subjects" },
  { key: "terms", label: "Périodes", href: "/terms" },
  { key: "assessments", label: "Notes et évaluations", href: "/assessments" },
  { key: "sessions", label: "Séances et présences", href: "/sessions" },
  { key: "teachers", label: "Enseignants", href: "/teachers" },
  { key: "users", label: "Utilisateurs", href: "/users" },
  { key: "payroll", label: "Paie", href: "/payroll" },
  { key: "settings", label: "Paramètres", href: "/settings" },
  { key: "access", label: "Gestion des accès", href: "/settings#access" },
] as const;

export type ResourceKey = (typeof ACCESS_RESOURCES)[number]["key"];

/** Défauts (alignés sur le menu actuel) si aucune matrice n'est enregistrée. */
export const DEFAULT_ACCESS: Record<Role, Partial<Record<ResourceKey, boolean>>> = {
  ADMIN: Object.fromEntries(ACCESS_RESOURCES.map((r) => [r.key, true])) as Record<ResourceKey, boolean>,
  DIRECTOR: Object.fromEntries(ACCESS_RESOURCES.map((r) => [r.key, true])) as Record<ResourceKey, boolean>,
  MANAGER: {
    dashboard: true,
    timetable: true,
    presents: true,
    announcements: true,
    reclamations: true,
    "school-years": false,
    classes: true,
    students: false,
    subjects: false,
    terms: true,
    assessments: false,
    sessions: false,
    teachers: true,
    users: true,
    payroll: false,
    settings: true,
    access: false,
  },
  TEACHER: {
    dashboard: true,
    timetable: true,
    presents: true,
    announcements: true,
    reclamations: true,
    "school-years": false,
    classes: false,
    students: true,
    subjects: true,
    terms: false,
    assessments: true,
    sessions: true,
    teachers: false,
    users: false,
    payroll: true,
    settings: true,
    access: false,
  },
  STUDENT: {
    dashboard: true,
    timetable: true,
    presents: true,
    announcements: true,
    reclamations: true,
    settings: true,
    access: false,
  },
};

export function canManageAccess(role: Role): boolean {
  return role === "ADMIN" || role === "DIRECTOR";
}

/**
 * overrides : map "ROLE:resource" → boolean (depuis AppSetting).
 */
export function canAccessResource(
  role: Role,
  resource: ResourceKey,
  overrides?: Record<string, boolean> | Map<string, boolean>,
): boolean {
  const key = `${role}:${resource}`;
  if (overrides) {
    if (overrides instanceof Map) {
      if (overrides.has(key)) return overrides.get(key)!;
    } else if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      return overrides[key];
    }
  }
  return DEFAULT_ACCESS[role]?.[resource] ?? false;
}

/** Map href prefix → resource key (longest match). */
export function resourceForHref(href: string): ResourceKey | null {
  const sorted = [...ACCESS_RESOURCES].sort((a, b) => b.href.length - a.href.length);
  for (const r of sorted) {
    if (r.key === "access") continue;
    if (href === r.href || href.startsWith(r.href + "/")) return r.key;
  }
  return null;
}
