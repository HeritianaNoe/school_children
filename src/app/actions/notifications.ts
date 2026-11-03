"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done } from "@/lib/flash";

export async function markRead(fd: FormData) {
  const u = await requireUser();
  await prisma.notification.updateMany({
    where: { id: String(fd.get("id")), userId: u.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markAllRead() {
  const u = await requireUser();
  await prisma.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  done("/notifications", "notifications_read");
}
