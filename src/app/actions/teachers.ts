"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import { done, fail } from "@/lib/flash";
import { readPhoto } from "@/lib/photo";
import { applyUserPhoto } from "@/lib/user-photo";
import { ensureContractsForYear } from "@/lib/contracts";

const createSchema = z.object({
  lastName: z.string().min(1).max(80),
  firstName: z.string().min(1).max(80),
  email: z.string().email().max(160),
  hourlyRate: z.coerce.number().min(0),
  status: z.enum(["TITULAIRE", "CONTRACTUEL", "VACATAIRE", "PERMANENT", "STAGIAIRE"]).default("CONTRACTUEL"),
  phone: z.string().max(40).optional(),
  active: z.boolean().optional(),
});

export async function createTeacher(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const parsed = createSchema.safeParse({
    lastName: String(fd.get("lastName") ?? "").trim(),
    firstName: String(fd.get("firstName") ?? "").trim(),
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
    hourlyRate: fd.get("hourlyRate"),
    status: fd.get("status") || undefined,
    phone: String(fd.get("phone") ?? "").trim() || undefined,
    active: fd.get("active") === "on" || fd.get("active") === "true",
  });
  if (!parsed.success) fail("/teachers/new", "validation");

  const d = parsed.data;

  const photo = await readPhoto(fd);
  if (!photo.ok) fail("/teachers/new", photo.key);

  const rawPassword = String(fd.get("password") ?? "");
  if (rawPassword !== "" && (rawPassword.length < 8 || rawPassword.length > 72)) {
    fail("/teachers/new", "password_short");
  }
  const passwordHash = await bcrypt.hash(rawPassword || DEFAULT_PASSWORDS.STAFF, 10);

  let userId: string;
  try {
    const teacher = await prisma.teacher.create({
      data: {
        hourlyRate: d.hourlyRate,
        status: d.status,
        user: {
          create: {
            name: `${d.lastName} ${d.firstName}`,
            email: d.email,
            role: "TEACHER",
            phone: d.phone ?? null,
            active: d.active ?? true,
            passwordHash,
          },
        },
      },
    });
    userId = teacher.userId;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      fail("/teachers/new", "email_taken");
    }
    throw e;
  }

  await applyUserPhoto(userId, photo);

  // Contrat de l'année scolaire courante dès la création (sans effet s'il n'y a pas d'année courante)
  const current = await prisma.schoolYear.findFirst({ where: { isCurrent: true }, select: { id: true } });
  if (current) await ensureContractsForYear(prisma, current.id);

  revalidatePath("/teachers");
  revalidatePath("/users");
  done("/teachers", "created");
}
