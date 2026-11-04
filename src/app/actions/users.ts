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

const roleEnum = z.enum(["ADMIN", "DIRECTOR", "MANAGER", "TEACHER", "STUDENT"]);

// Un nouvel utilisateur est un membre de l'administration : les enseignants et les élèves
// se créent depuis leurs propres pages (« Enseignants » et « Élèves »).
const adminRoleEnum = z.enum(["ADMIN", "DIRECTOR", "MANAGER"]);

const phoneField = z.string().max(40).optional();

const createSchema = z.object({
  lastName: z.string().min(1).max(80),
  firstName: z.string().min(1).max(80),
  email: z.string().email().max(160),
  role: adminRoleEnum,
  phone: phoneField,
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  lastName: z.string().min(1).max(80),
  // Optionnel : certains comptes historiques n'ont qu'un seul mot (ex. « Administrateur »)
  firstName: z.string().max(80).optional(),
  email: z.string().email().max(160),
  role: roleEnum,
  phone: phoneField,
  active: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

function readCreate(fd: FormData) {
  const lastName = String(fd.get("lastName") ?? "").trim();
  const firstName = String(fd.get("firstName") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "");
  const active = fd.get("active") === "on" || fd.get("active") === "true";
  const phone = String(fd.get("phone") ?? "").trim() || undefined;
  return createSchema.safeParse({ lastName, firstName, email, role, phone, active });
}

function readUpdate(fd: FormData) {
  const lastName = String(fd.get("lastName") ?? "").trim();
  const firstName = String(fd.get("firstName") ?? "").trim() || undefined;
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "");
  const active = fd.get("active") === "on" || fd.get("active") === "true";
  const resetPassword = fd.get("resetPassword") === "on" || fd.get("resetPassword") === "true";
  const phone = String(fd.get("phone") ?? "").trim() || undefined;
  return updateSchema.safeParse({ lastName, firstName, email, role, phone, active, resetPassword });
}

const isUnique = (e: unknown, field?: string) =>
  e instanceof Prisma.PrismaClientKnownRequestError &&
  e.code === "P2002" &&
  (!field || String(e.meta?.target ?? "").includes(field));

export async function createUser(fd: FormData) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const parsed = readCreate(fd);
  if (!parsed.success) fail("/users/new", "validation");

  const d = parsed.data;

  // Seul un ADMIN peut créer un autre ADMIN
  if (d.role === "ADMIN" && me.role !== "ADMIN") fail("/users/new", "forbidden");

  const photo = await readPhoto(fd);
  if (!photo.ok) fail("/users/new", photo.key);

  const rawPassword = String(fd.get("password") ?? "");
  if (rawPassword !== "" && (rawPassword.length < 8 || rawPassword.length > 72)) {
    fail("/users/new", "password_short");
  }
  const passwordHash = await bcrypt.hash(rawPassword || DEFAULT_PASSWORDS.STAFF, 10);

  let userId: string;
  try {
    const created = await prisma.user.create({
      data: {
        name: `${d.lastName} ${d.firstName}`,
        email: d.email,
        role: d.role,
        phone: d.phone ?? null,
        active: d.active ?? true,
        passwordHash,
      },
    });
    userId = created.id;
  } catch (e) {
    if (isUnique(e, "email")) fail("/users/new", "email_taken");
    throw e;
  }

  await applyUserPhoto(userId, photo);

  revalidatePath("/users");
  done("/users", "created");
}

export async function updateUser(id: string, fd: FormData) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const parsed = readUpdate(fd);
  if (!parsed.success) fail(`/users/${id}/edit`, "validation");

  const d = parsed.data;
  const existing = await prisma.user.findUnique({ where: { id }, include: { student: { select: { id: true } } } });
  if (!existing) fail("/users", "not_found");

  const photo = await readPhoto(fd);
  if (!photo.ok) fail(`/users/${id}/edit`, photo.key);

  // Empêcher de se rétrograder / désactiver soi-même
  if (existing.id === me.id) {
    if (d.role !== existing.role) fail(`/users/${id}/edit`, "forbidden");
    if (d.active === false) fail(`/users/${id}/edit`, "forbidden");
  }

  // Seul ADMIN gère les ADMIN
  if ((existing.role === "ADMIN" || d.role === "ADMIN") && me.role !== "ADMIN") {
    fail(`/users/${id}/edit`, "forbidden");
  }

  // Un compte élève suit la convention « Prénom Nom » de sa fiche ; les autres « Nom Prénom »
  if (existing.student && !d.firstName) fail(`/users/${id}/edit`, "validation");
  const name = existing.student
    ? `${d.firstName} ${d.lastName}`
    : [d.lastName, d.firstName].filter(Boolean).join(" ");

  const data: Prisma.UserUpdateInput = {
    name,
    email: d.email,
    role: d.role,
    active: d.active ?? true,
    // Le téléphone d'un compte élève est porté par sa fiche élève
    ...(existing.student ? {} : { phone: d.phone ?? null }),
  };

  if (d.resetPassword) {
    const defaultPwd =
      d.role === "STUDENT" ? DEFAULT_PASSWORDS.STUDENT : DEFAULT_PASSWORDS.STAFF;
    data.passwordHash = await bcrypt.hash(defaultPwd, 10);
  }

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (e) {
    if (isUnique(e, "email")) fail(`/users/${id}/edit`, "email_taken");
    throw e;
  }

  if (existing.student) {
    await prisma.student.update({
      where: { id: existing.student.id },
      data: { phone: d.phone ?? null, firstName: d.firstName!, lastName: d.lastName },
    });
  }
  await applyUserPhoto(id, photo, fd.get("removePhoto") === "on");

  // Synchroniser la fiche Enseignant avec le rôle Utilisateur
  const withTeacher = await prisma.user.findUnique({
    where: { id },
    include: { teacher: true },
  });
  if (withTeacher) {
    if (withTeacher.role === "TEACHER" && !withTeacher.teacher) {
      await prisma.teacher.create({
        data: { userId: id, hourlyRate: 0 },
      });
    }
  }

  revalidatePath("/users");
  revalidatePath("/teachers");
  revalidatePath(`/users/${id}/edit`);
  done("/users", "updated");
}

export async function deleteUser(id: string) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  if (id === me.id) fail("/users", "forbidden");

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { student: { select: { id: true } }, teacher: { select: { id: true } } },
  });
  if (!existing) fail("/users", "not_found");

  if (existing.role === "ADMIN" && me.role !== "ADMIN") fail("/users", "forbidden");
  // Comme pour « Élèves » : seuls ADMIN et DIRECTOR suppriment un élève ou un enseignant
  if ((existing.student || existing.teacher) && me.role === "MANAGER") fail("/users", "forbidden");

  const ops: Prisma.PrismaPromise<unknown>[] = [];

  if (existing.student) {
    const sid = existing.student.id;
    ops.push(
      prisma.grade.deleteMany({ where: { studentId: sid } }),
      prisma.studentAttendance.deleteMany({ where: { studentId: sid } }),
      prisma.comment.deleteMany({ where: { studentId: sid } }),
    );
  }

  if (existing.teacher) {
    const tid = existing.teacher.id;
    // Les matières et séances restent à l'école : on ne les supprime pas avec l'enseignant.
    const inUse =
      (await prisma.course.count({ where: { teacherId: tid } })) +
      (await prisma.session.count({ where: { teacherId: tid } }));
    if (inUse > 0) fail("/users", "teacher_in_use");
    ops.push(
      prisma.teacherAttendance.deleteMany({ where: { teacherId: tid } }),
      prisma.payslip.deleteMany({ where: { teacherId: tid } }),
      prisma.comment.deleteMany({ where: { teacherId: tid } }),
    );
  }

  ops.push(
    // Les annonces publiées par ce compte sont conservées et reprises par la personne qui supprime
    prisma.announcement.updateMany({ where: { authorId: id }, data: { authorId: me.id } }),
    prisma.comment.deleteMany({ where: { authorId: id } }),
    prisma.reclamation.deleteMany({ where: { authorId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    // Le compte supprime ensuite la fiche élève / enseignant et la photo (cascade)
    prisma.user.delete({ where: { id } }),
  );
  await prisma.$transaction(ops);

  revalidatePath("/users");
  revalidatePath("/teachers");
  revalidatePath("/students");
  revalidatePath("/classes");
  revalidatePath("/dashboard");
  done("/users", "deleted");
}

export async function toggleUserActive(id: string) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  if (id === me.id) fail("/users", "forbidden");

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) fail("/users", "not_found");
  if (existing.role === "ADMIN" && me.role !== "ADMIN") fail("/users", "forbidden");

  await prisma.user.update({
    where: { id },
    data: { active: !existing.active },
  });
  revalidatePath("/users");
  done("/users", existing.active ? "deactivated" : "activated");
}
