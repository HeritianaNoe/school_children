import type { Role } from "@prisma/client";

/**
 * Source unique des groupes de rôles. À utiliser dans les pages, les actions
 * et le menu, afin que ce que l'on affiche corresponde toujours à ce que l'on autorise.
 */
export const ROLES = {
  /** Administration complète (gestion des utilisateurs, classes, périodes…) */
  STAFF: ["ADMIN", "DIRECTOR", "MANAGER"],
  /** Direction : peut écrire sur les données pédagogiques */
  DIRECTION: ["ADMIN", "DIRECTOR"],
  /** Pédagogie : élèves, matières, notes, séances, paie (consultation enseignant) */
  PEDAGOGY: ["ADMIN", "DIRECTOR", "TEACHER"],
} as const satisfies Record<string, readonly Role[]>;

export const hasRole = (role: Role, group: readonly Role[]) => group.includes(role);
