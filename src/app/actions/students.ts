"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(80),
  lastName: z.string().min(1, "Nom requis").max(80),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(120).optional(),
  sex: z.enum(["M", "F"]).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(40).optional(),
  parentName: z.string().max(120).optional(),
  parentPhone: z.string().max(40).optional(),
  classeId: z.string().min(1, "Classe requise"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  photoUrl: z.string().optional(),
});

async function nextMatricule(year: string) {
  const prefix = `M${year.slice(2, 4)}`; // 2026-2027 → M26
  const last = await prisma.student.findFirst({
    where: { matricule: { startsWith: prefix } },
    orderBy: { matricule: "desc" },
    select: { matricule: true },
  });
  let seq = 1;
  if (last) {
    const n = parseInt(last.matricule.split("-")[1] ?? "0", 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}

export async function createStudent(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);

  const raw = Object.fromEntries(fd) as Record<string, string>;
  const data = schema.parse({
    firstName: raw.firstName?.trim(),
    lastName: raw.lastName?.trim(),
    birthDate: raw.birthDate || undefined,
    birthPlace: raw.birthPlace?.trim() || undefined,
    sex: raw.sex || undefined,
    address: raw.address?.trim() || undefined,
    phone: raw.phone?.trim() || undefined,
    parentName: raw.parentName?.trim() || undefined,
    parentPhone: raw.parentPhone?.trim() || undefined,
    classeId: raw.classeId,
    email: raw.email?.trim().toLowerCase() || "",
    photoUrl: raw.photoUrl || undefined,
  });

  const classe = await prisma.classe.findUniqueOrThrow({ where: { id: data.classeId } });
  const matricule = await nextMatricule(classe.year);
  const fullName = `${data.firstName} ${data.lastName}`;
  const email =
    data.email ||
    `${data.firstName}.${data.lastName}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.]/g, "") +
      "@ecole.mg";

  const passwordHash = await bcrypt.hash("eleve123", 10);

  const student = await prisma.student.create({
    data: {
      matricule,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      birthPlace: data.birthPlace,
      sex: data.sex as any,
      address: data.address,
      phone: data.phone,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      photoUrl: data.photoUrl || null,
      registeredAt: new Date(),
      classe: { connect: { id: data.classeId } },
      user: {
        create: {
          email,
          name: fullName,
          role: "STUDENT",
          passwordHash,
        },
      },
    },
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect(`/students/${student.id}?created=1`);
}
