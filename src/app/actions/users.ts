"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import { done, fail } from "@/lib/flash";

const roleEnum = z.enum(["ADMIN", "DIRECTOR", "MANAGER", "TEACHER", "STUDENT"]);

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  role: roleEnum,
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  role: roleEnum,
  active: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

function readCreate(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "");
  const active = fd.get("active") === "on" || fd.get("active") === "true";
  return createSchema.safeParse({ name, email, role, active });
}

function readUpdate(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "");
  const active = fd.get("active") === "on" || fd.get("active") === "true";
  const resetPassword = fd.get("resetPassword") === "on" || fd.get("resetPassword") === "true";
  return updateSchema.safeParse({ name, email, role, active, resetPassword });
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

  const defaultPwd =
    d.role === "STUDENT" ? DEFAULT_PASSWORDS.STUDENT : DEFAULT_PASSWORDS.STAFF;
  const passwordHash = await bcrypt.hash(defaultPwd, 10);

  try {
    if (d.role === "TEACHER") {
      await prisma.teacher.create({
        data: {
          hourlyRate: 0,
          user: {
            create: {
              name: d.name,
              email: d.email,
              role: d.role,
              active: d.active ?? true,
              passwordHash,
            },
          },
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: d.name,
          email: d.email,
          role: d.role,
          active: d.active ?? true,
          passwordHash,
        },
      });
    }
  } catch (e) {
    if (isUnique(e, "email")) fail("/users/new", "email_taken");
    throw e;
  }

  revalidatePath("/users");
  revalidatePath("/teachers");
  done("/users", "created");
}

export async function updateUser(id: string, fd: FormData) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const parsed = readUpdate(fd);
  if (!parsed.success) fail(`/users/${id}/edit`, "validation");

  const d = parsed.data;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) fail("/users", "not_found");

  // Empêcher de se rétrograder / désactiver soi-même
  if (existing.id === me.id) {
    if (d.role !== existing.role) fail(`/users/${id}/edit`, "forbidden");
    if (d.active === false) fail(`/users/${id}/edit`, "forbidden");
  }

  // Seul ADMIN gère les ADMIN
  if ((existing.role === "ADMIN" || d.role === "ADMIN") && me.role !== "ADMIN") {
    fail(`/users/${id}/edit`, "forbidden");
  }

  const data: Prisma.UserUpdateInput = {
    name: d.name,
    email: d.email,
    role: d.role,
    active: d.active ?? true,
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
    include: { student: true, teacher: true },
  });
  if (!existing) fail("/users", "not_found");

  if (existing.role === "ADMIN" && me.role !== "ADMIN") fail("/users", "forbidden");

  // Si lié à un élève ou enseignant, on refuse la suppression (cascade serait dangereuse)
  if (existing.student || existing.teacher) {
    fail("/users", "user_linked");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
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
