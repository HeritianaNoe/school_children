"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";
import { ROLES, ACCESS_RESOURCES, STAFF_ROLES, canManageAccess } from "@/lib/permissions";
import { CAPACITY_TAG } from "@/lib/capacity";
import { MAX_STUDENTS_LIMITS, SETTINGS_TAG, saveMaxStudentsPerClass, saveRoleAccessMap } from "@/lib/settings";

const maxSchema = z.coerce.number().int().min(MAX_STUDENTS_LIMITS.min).max(MAX_STUDENTS_LIMITS.max);

/** Enregistre le nombre maximum d'élèves par classe (administrateur et directeur). */
export async function updateMaxStudents(fd: FormData) {
  await requireUser([...ROLES.DIRECTION]);
  const p = maxSchema.safeParse(fd.get("maxStudents"));
  if (!p.success) fail("/settings", "validation");
  await saveMaxStudentsPerClass(p.data);
  revalidateTag(SETTINGS_TAG);
  revalidateTag(CAPACITY_TAG);
  revalidatePath("/", "layout");
  done("/settings", "settings_saved");
}

/**
 * Enregistre la matrice d'accès (checkboxes).
 * Admin et Directeur uniquement.
 */
export async function saveAccessMatrix(fd: FormData) {
  const u = await requireUser([...ROLES.DIRECTION]);
  if (!canManageAccess(u.role)) fail("/settings", "forbidden");

  const map: Record<string, boolean> = {};
  for (const role of STAFF_ROLES) {
    for (const res of ACCESS_RESOURCES) {
      const field = `access_${role}_${res.key}`;
      let checked = fd.get(field) === "on" || fd.get(field) === "true";
      // Admin et Directeur gardent toujours « access »
      if (res.key === "access" && (role === "ADMIN" || role === "DIRECTOR")) {
        checked = true;
      }
      map[`${role}:${res.key}`] = checked;
    }
  }

  await saveRoleAccessMap(map);
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  done("/settings", "settings_saved");
}
