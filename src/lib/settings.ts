import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { ACCESS_RESOURCES, DEFAULT_ACCESS, STAFF_ROLES, type ResourceKey } from "./permissions";
import type { Role } from "@prisma/client";

/** Étiquette de cache : à invalider (revalidateTag) quand un paramètre change. */
export const SETTINGS_TAG = "app-settings";

export const DEFAULT_MAX_STUDENTS_PER_CLASS = 40;
export const MAX_STUDENTS_LIMITS = { min: 1, max: 500 } as const;
const KEY_MAX_STUDENTS = "max_students_per_class";
const KEY_ROLE_ACCESS = "role_access";

/**
 * Nombre maximum d'élèves par classe (paramètre global).
 * Lu une seule fois puis gardé en cache serveur jusqu'à sa modification.
 */
export const getMaxStudentsPerClass = unstable_cache(
  async (): Promise<number> => {
    try {
      const row = await prisma.appSetting.findUnique({ where: { key: KEY_MAX_STUDENTS } });
      const n = row ? parseInt(row.value, 10) : NaN;
      return Number.isFinite(n) && n >= MAX_STUDENTS_LIMITS.min ? n : DEFAULT_MAX_STUDENTS_PER_CLASS;
    } catch {
      return DEFAULT_MAX_STUDENTS_PER_CLASS;
    }
  },
  ["setting:max-students-per-class"],
  { tags: [SETTINGS_TAG], revalidate: 300 }
);

export async function saveMaxStudentsPerClass(value: number) {
  await prisma.appSetting.upsert({
    where: { key: KEY_MAX_STUDENTS },
    create: { key: KEY_MAX_STUDENTS, value: String(value) },
    update: { value: String(value) },
  });
}

/**
 * Matrice d'accès stockée en JSON dans app_settings.
 * Format : { "ADMIN:students": true, "TEACHER:users": false, ... }
 */
export const getRoleAccessMap = unstable_cache(
  async (): Promise<Record<string, boolean>> => {
    try {
      const row = await prisma.appSetting.findUnique({ where: { key: KEY_ROLE_ACCESS } });
      if (!row?.value) return {};
      const parsed = JSON.parse(row.value) as Record<string, boolean>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  },
  ["setting:role-access"],
  { tags: [SETTINGS_TAG], revalidate: 300 }
);

export async function saveRoleAccessMap(map: Record<string, boolean>) {
  await prisma.appSetting.upsert({
    where: { key: KEY_ROLE_ACCESS },
    create: { key: KEY_ROLE_ACCESS, value: JSON.stringify(map) },
    update: { value: JSON.stringify(map) },
  });
}

/** Construit la map complète (défauts + overrides) pour l'UI. */
export function resolveAccessMatrix(overrides: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const role of STAFF_ROLES) {
    for (const res of ACCESS_RESOURCES) {
      const k = `${role}:${res.key}`;
      if (Object.prototype.hasOwnProperty.call(overrides, k)) out[k] = overrides[k];
      else out[k] = DEFAULT_ACCESS[role as Role]?.[res.key as ResourceKey] ?? false;
    }
  }
  return out;
}
