"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrateur",
  DIRECTOR: "Directeur",
  TEACHER: "Enseignant",
  STUDENT: "Élève",
  PARENT: "Parent",
};

export default function Nav({
  user,
  unread = 0,
  studentId,
}: {
  user: SessionUser;
  unread?: number;
  studentId?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const staff = user.role === "ADMIN" || user.role === "DIRECTOR";

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/dashboard", label: "Tableau de bord", show: true },
    { href: "/sessions", label: "Séances", show: user.role !== "STUDENT" },
    { href: "/assessments", label: "Évaluations", show: user.role !== "STUDENT" },
    { href: "/students", label: "Élèves", show: user.role !== "STUDENT" },
    { href: "/teachers", label: "Enseignants", show: staff },
    { href: "/payroll", label: "Paie", show: staff || user.role === "TEACHER" },
    { href: studentId ? `/students/${studentId}` : "#", label: "Mon dossier", show: !!studentId },
    { href: "/notifications", label: "Notifications", show: true },
  ];

  const close = () => setOpen(false);

  return (
    <>
      <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={close} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">🏫 Gestion Scolaire</div>
        <nav className="sidebar-nav">
          {links
            .filter((l) => l.show)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href || pathname.startsWith(l.href + "/") ? "active" : ""}
                onClick={close}
              >
                {l.label}
                {l.href === "/notifications" && unread > 0 && (
                  <span className="badge">{unread}</span>
                )}
              </Link>
            ))}
        </nav>
        <div className="sidebar-footer">
          <div>
            <strong style={{ color: "#fff" }}>{user.name}</strong>
            <div>{roleLabel[user.role] ?? user.role}</div>
          </div>
          <form action={logout}>
            <button type="submit" className="btn-secondary btn-sm" style={{ width: "100%", marginTop: 8 }}>
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="topbar no-print">
        <button type="button" className="menu-toggle" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          ☰
        </button>
        <div className="topbar-title">Gestion Scolaire</div>
      </div>
    </>
  );
}
