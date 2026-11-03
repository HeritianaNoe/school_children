"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";

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
