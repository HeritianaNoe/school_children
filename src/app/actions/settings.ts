"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";
import { ROLES } from "@/lib/permissions";
import { CAPACITY_TAG } from "@/lib/capacity";
import { MAX_STUDENTS_LIMITS, SETTINGS_TAG, saveMaxStudentsPerClass } from "@/lib/settings";

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
