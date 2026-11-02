import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session";

export default async function Nav({ user }: { user: SessionUser }) {
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  const student = user.role === "STUDENT"
    ? await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
    : null;
  const staff = user.role === "ADMIN" || user.role === "DIRECTOR";

  return (
    <nav>
      <strong>🏫 École</strong>
      <Link href="/dashboard">Accueil</Link>
      {user.role !== "STUDENT" && <Link href="/sessions">Séances</Link>}
      {user.role !== "STUDENT" && <Link href="/assessments">Noty</Link>}
      {user.role !== "STUDENT" && <Link href="/students">Mpianatra</Link>}
      {staff && <Link href="/teachers">Mpampianatra</Link>}
      {(staff || user.role === "TEACHER") && <Link href="/payroll">Karama</Link>}
      {student && <Link href={`/students/${student.id}`}>Ny noty / présence</Link>}
      <Link href="/notifications">🔔{unread > 0 && <span className="badge">{unread}</span>}</Link>
      <span style={{ marginLeft: "auto" }}>{user.name} ({user.role})</span>
      <form action={logout}><button className="link">Hivoaka</button></form>
    </nav>
  );
}
