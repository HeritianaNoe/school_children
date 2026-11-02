import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  const u = await getSession();
  if (!u) redirect("/login");
  if (roles && !roles.includes(u.role)) throw new Error("Forbidden");
  return u;
}

export const isStaff = (r: Role) => r === "ADMIN" || r === "DIRECTOR";
