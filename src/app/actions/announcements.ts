"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(5).max(4000),
  published: z.boolean().optional(),
});

export async function createAnnouncement(fd: FormData) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const parsed = createSchema.safeParse({
    title: String(fd.get("title") ?? "").trim(),
    body: String(fd.get("body") ?? "").trim(),
    published: fd.get("published") === "on" || fd.get("published") === "true",
  });
  if (!parsed.success) fail("/announcements/new", "validation");

  await prisma.announcement.create({
    data: {
      authorId: u.id,
      title: parsed.data.title,
      body: parsed.data.body,
      published: parsed.data.published ?? true,
    },
  });
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  done("/dashboard", "announcement_created");
}

export async function deleteAnnouncement(id: string) {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/announcements");
  done("/announcements", "deleted");
}
