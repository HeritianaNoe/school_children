import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

/** Étiquette de cache : à invalider (revalidateTag) quand un paramètre change. */
export const SETTINGS_TAG = "app-settings";

export const DEFAULT_MAX_STUDENTS_PER_CLASS = 40;
export const MAX_STUDENTS_LIMITS = { min: 1, max: 500 } as const;
const KEY_MAX_STUDENTS = "max_students_per_class";

/**
 * Nombre maximum d'élèves par classe (paramètre global).
 * Lu une seule fois puis gardé en cache serveur jusqu'à sa modification : aucune requête SQL
 * supplémentaire à chaque page. Si la table n'existe pas encore (db:push pas lancé) → valeur par défaut.
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
