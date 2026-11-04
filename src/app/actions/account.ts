"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";
import { readPhoto } from "@/lib/photo";
import { applyUserPhoto } from "@/lib/user-photo";
import { revalidatePath } from "next/cache";

export async function changePassword(fd: FormData) {
  const u = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (next.length < 8) fail("/account", "password_short");
  if (next !== confirm) fail("/account", "password_mismatch");

  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) fail("/account", "password_wrong");

  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  done("/account", "password_changed");
}

/** Modification du profil de l'utilisateur connecté : photo et numéro de téléphone. */
export async function updateProfile(fd: FormData) {
  const u = await requireUser();

  const phoneRaw = String(fd.get("phone") ?? "").trim();
  if (phoneRaw.length > 40) fail("/account", "validation");
  const phone = phoneRaw || null;

  const photo = await readPhoto(fd);
  if (!photo.ok) fail("/account", photo.key);

  const student = await prisma.student.findUnique({ where: { userId: u.id }, select: { id: true } });
  // Le téléphone d'un compte élève est porté par sa fiche élève
  if (student) await prisma.student.update({ where: { id: student.id }, data: { phone } });
  else await prisma.user.update({ where: { id: u.id }, data: { phone } });

  await applyUserPhoto(u.id, photo, fd.get("removePhoto") === "on");

  revalidatePath("/", "layout");
  done("/account", "account_updated");
}
