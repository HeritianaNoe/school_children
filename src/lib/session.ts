import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { forbidden } from "./flash";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

export type SessionUser = { id: string; role: Role; name: string };
const COOKIE = "session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function createSession(u: SessionUser) {
  const token = await new SignJWT({ ...u })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 86400,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    return { id: payload.id as string, role: payload.role as Role, name: payload.name as string };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  // Le cookie peut survivre à la base de données (compte supprimé, base réinitialisée, compte désactivé) :
  // on vérifie que le compte existe toujours, sinon les écritures échouent (clé étrangère).
  const row = await prisma.user.findUnique({
    where: { id: s.id },
    select: { id: true, role: true, name: true, active: true },
  });
  if (!row || !row.active) redirect("/login?error=session");
  const u: SessionUser = { id: row.id, role: row.role, name: row.name };
  if (roles && !roles.includes(u.role)) forbidden();
  return u;
}

export const isStaff = (r: Role) => r === "ADMIN" || r === "DIRECTOR" || r === "MANAGER";
