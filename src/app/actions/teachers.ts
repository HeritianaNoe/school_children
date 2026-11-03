"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import { done, fail } from "@/lib/flash";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  hourlyRate: z.coerce.number().min(0),
  active: z.boolean().optional(),
});

export async function createTeacher(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const parsed = createSchema.safeParse({
    name: String(fd.get("name") ?? "").trim(),
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
    hourlyRate: fd.get("hourlyRate"),
    active: fd.get("active") === "on" || fd.get("active") === "true",
  });
  if (!parsed.success) fail("/teachers/new", "validation");

  const d = parsed.data;
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORDS.STAFF, 10);

  try {
    await prisma.teacher.create({
      data: {
        hourlyRate: d.hourlyRate,
        user: {
          create: {
            name: d.name,
            email: d.email,
            role: "TEACHER",
            active: d.active ?? true,
            passwordHash,
          },
        },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      fail("/teachers/new", "email_taken");
    }
    throw e;
  }

  revalidatePath("/teachers");
  revalidatePath("/users");
  done("/teachers", "created");
}
