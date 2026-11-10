"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import { nextMatricule } from "@/lib/matricule";
import { readPhoto } from "@/lib/photo";
import { parseDateInput } from "@/lib/format";
import { done, fail } from "@/lib/flash";
import { accountShouldBeActive } from "@/lib/enrollment";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const studentSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  birthDate: dateStr.optional(),
  birthPlace: z.string().max(120).optional(),
  sex: z.enum(["M", "F"]).optional(),
  address: z.string().max(255).optional(),
  parentName: z.string().max(120).optional(),
  parentPhone: z.string().max(40).optional(),
  classeId: z.string().min(1),
  nomenclature: z.enum(["NEW", "PROMOTED", "REPEATER", "TRANSFERRED"]).default("NEW"),
  email: z.string().email().max(160).optional(),
  registeredAt: dateStr.optional(),
});

/** Lit le formulaire : espaces retirés, champs vides => undefined. */
function readForm(fd: FormData) {
  const out: Record<string, string | undefined> = {};
  for (const key of Object.keys(studentSchema.shape)) {
    const v = fd.get(key);
    const t = typeof v === "string" ? v.trim() : "";
    out[key] = t === "" ? undefined : key === "email" ? t.toLowerCase() : t;
  }
  return studentSchema.safeParse(out);
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** prenom.nom@ecole.mg, avec suffixe numérique si l'adresse existe déjà. */
async function uniqueEmail(first: string, last: string, ignoreUserId?: string) {
  const base = `${slug(first)}.${slug(last)}` || "eleve";
  for (let i = 0; i < 200; i++) {
    const email = `${base}${i === 0 ? "" : i + 1}@ecole.mg`;
    const found = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!found || found.id === ignoreUserId) return email;
  }
  return `${base}.${Date.now()}@ecole.mg`;
}

const isUnique = (e: unknown, field?: string) =>
  e instanceof Prisma.PrismaClientKnownRequestError &&
  e.code === "P2002" &&
  (!field || String(e.meta?.target ?? "").includes(field));

export async function createStudent(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);

  const parsed = readForm(fd);
  if (!parsed.success) fail("/students/new", "validation");
  const d = parsed.data;

  const photo = await readPhoto(fd);
  if (!photo.ok) fail("/students/new", photo.key);

  const classe = await prisma.classe.findUnique({ where: { id: d.classeId }, include: { schoolYear: true } });
  if (!classe) fail("/students/new", "not_found");

  if (d.email) {
    const taken = await prisma.user.findUnique({ where: { email: d.email }, select: { id: true } });
    if (taken) fail("/students/new", "email_taken");
  }
  const email = d.email ?? (await uniqueEmail(d.firstName, d.lastName));
  const rawPassword = String(fd.get("password") ?? "");
  if (rawPassword !== "" && (rawPassword.length < 8 || rawPassword.length > 72)) {
    fail("/students/new", "password_short");
  }
  const passwordHash = await bcrypt.hash(rawPassword || DEFAULT_PASSWORDS.STUDENT, 10);
  // Compte actif seulement si la classe appartient à l'année courante
  const active = await accountShouldBeActive(prisma, classe.schoolYearId);

  let studentId: string | null = null;
  // Le matricule est unique : en cas de collision (deux inscriptions simultanées), on recalcule.
  for (let attempt = 0; attempt < 5 && !studentId; attempt++) {
    const matricule = await nextMatricule(classe.schoolYear.name);
    try {
      const student = await prisma.student.create({
        data: {
          matricule,
          firstName: d.firstName,
          lastName: d.lastName,
          birthDate: d.birthDate ? parseDateInput(d.birthDate) : null,
          birthPlace: d.birthPlace ?? null,
          sex: d.sex ?? null,
          address: d.address ?? null,
          parentName: d.parentName ?? null,
          parentPhone: d.parentPhone ?? null,
          registeredAt: d.registeredAt ? parseDateInput(d.registeredAt) : new Date(),
          nomenclature: d.nomenclature,
          classe: { connect: { id: classe.id } },
          user: {
            create: { email, name: `${d.firstName} ${d.lastName}`, role: "STUDENT", passwordHash, active },
          },
        },
      });
      studentId = student.id;
    } catch (e) {
      if (isUnique(e, "matricule")) continue;
      if (isUnique(e, "email")) fail("/students/new", "email_taken");
      throw e;
    }
  }
  if (!studentId) fail("/students/new", "generic");

  if (!photo.empty) {
    await prisma.studentPhoto.create({
      data: { studentId, data: photo.data, mime: photo.mime },
    });
    await prisma.student.update({
      where: { id: studentId },
      data: { photoUrl: `/api/students/${studentId}/photo?v=${Date.now()}` },
    });
  }

  revalidatePath("/students");
  revalidatePath("/classes");
  revalidatePath("/dashboard");
  redirect(`/students/${studentId}?created=1`);
}

export async function updateStudent(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("id") ?? "");
  const back = `/students/${id}/edit`;

  const current = await prisma.student.findUnique({
    where: { id },
    include: { user: true, classe: { select: { schoolYearId: true } } },
  });
  if (!current) fail("/students", "not_found");

  const parsed = readForm(fd);
  if (!parsed.success) fail(back, "validation");
  const d = parsed.data;

  const photo = await readPhoto(fd);
  if (!photo.ok) fail(back, photo.key);

  const classe = await prisma.classe.findUnique({ where: { id: d.classeId }, include: { schoolYear: true } });
  if (!classe) fail(back, "not_found");

  const email = d.email ?? current.user.email;
  if (email !== current.user.email) {
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) fail(back, "email_taken");
  }

  // Réinscription = passage dans une classe d'une autre année : le compte suit l'année courante.
  // (Un simple changement de classe dans la même année ne touche pas à l'état du compte.)
  const reenrolled = classe.schoolYearId !== current.classe.schoolYearId;
  const active = reenrolled ? await accountShouldBeActive(prisma, classe.schoolYearId) : undefined;

  let photoUrl = current.photoUrl;
  if (!photo.empty) {
    await prisma.studentPhoto.upsert({
      where: { studentId: id },
      create: { studentId: id, data: photo.data, mime: photo.mime },
      update: { data: photo.data, mime: photo.mime },
    });
    photoUrl = `/api/students/${id}/photo?v=${Date.now()}`;
  } else if (fd.get("removePhoto") === "on") {
    await prisma.studentPhoto.deleteMany({ where: { studentId: id } });
    photoUrl = null;
  }

  try {
    await prisma.student.update({
      where: { id },
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        birthDate: d.birthDate ? parseDateInput(d.birthDate) : null,
        birthPlace: d.birthPlace ?? null,
        sex: d.sex ?? null,
        address: d.address ?? null,
        parentName: d.parentName ?? null,
        parentPhone: d.parentPhone ?? null,
        registeredAt: d.registeredAt ? parseDateInput(d.registeredAt) : current.registeredAt,
        nomenclature: d.nomenclature,
        photoUrl,
        classe: { connect: { id: classe.id } },
        user: { update: { email, name: `${d.firstName} ${d.lastName}`, ...(active === undefined ? {} : { active }) } },
      },
    });
  } catch (e) {
    if (isUnique(e, "email")) fail(back, "email_taken");
    throw e;
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  done(`/students/${id}`, "student_updated");
}

export async function deleteStudent(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const id = String(fd.get("id") ?? "");
  const s = await prisma.student.findUnique({ where: { id }, select: { userId: true } });
  if (!s) fail("/students", "not_found");

  // On supprime d'abord les données rattachées ; le compte utilisateur supprime ensuite l'élève (cascade).
  await prisma.$transaction([
    prisma.grade.deleteMany({ where: { studentId: id } }),
    prisma.studentAttendance.deleteMany({ where: { studentId: id } }),
    prisma.comment.deleteMany({ where: { studentId: id } }),
    prisma.notification.deleteMany({ where: { userId: s.userId } }),
    prisma.user.delete({ where: { id: s.userId } }),
  ]);

  revalidatePath("/students");
  revalidatePath("/dashboard");
  done("/students", "student_deleted");
}
