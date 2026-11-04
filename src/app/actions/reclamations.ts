"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(5).max(4000),
});

export async function createReclamation(fd: FormData) {
  const u = await requireUser();
  const parsed = createSchema.safeParse({
    subject: String(fd.get("subject") ?? "").trim(),
    body: String(fd.get("body") ?? "").trim(),
  });
  if (!parsed.success) fail("/reclamations/new", "validation");

  await prisma.reclamation.create({
    data: {
      authorId: u.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });
  revalidatePath("/reclamations");
  revalidatePath("/dashboard");
  done("/dashboard", "reclamation_created");
}

export async function updateReclamationStatus(id: string, fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const status = String(fd.get("status") ?? "OPEN");
  const response = String(fd.get("response") ?? "").trim() || null;
  if (!["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) fail("/reclamations", "validation");

  await prisma.reclamation.update({
    where: { id },
    data: { status, response },
  });
  revalidatePath("/reclamations");
  done("/reclamations", "updated");
}
