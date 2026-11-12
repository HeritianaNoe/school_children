"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/lib/labels";
import { ROLES, hasRole } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session";
import Icon, { type IconName } from "./Icons";

type NavLink = { href: string; label: string; icon: IconName; show: boolean };
type NavSection = { title?: string; links: NavLink[] };

export default function Nav({
  user,
  studentId,
  avatarUrl,
}: {
  user: SessionUser;
  studentId?: string | null;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  // Mobile : menu fermé par défaut (tiroir). Desktop : la sidebar est toujours visible (voir globals.css)
  const [open, setOpen] = useState(false);
  const staff = hasRole(user.role, ROLES.STAFF);
  const pedagogy = hasRole(user.role, ROLES.PEDAGOGY);
  const direction = hasRole(user.role, ROLES.DIRECTION);

  // Fermer le tiroir à chaque navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    window.addEventListener("sidebar-toggle", toggle);
    return () => window.removeEventListener("sidebar-toggle", toggle);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sidebar-state", { detail: open }));
    document.documentElement.classList.toggle("sidebar-open", open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // La visibilité d'un lien reprend exactement la garde de la page correspondante
  const sections: NavSection[] = [
    {
      links: [
        { href: "/dashboard", label: "Tableau de bord", icon: "dashboard", show: true },
        { href: "/timetable", label: "Emploi du temps", icon: "calendar", show: true },
        { href: "/presents", label: "Élèves présents", icon: "users", show: true },
        { href: "/announcements", label: "Annonces", icon: "megaphone", show: true },
        { href: "/reclamations", label: "Réclamations", icon: "alert", show: true },
      ],
    },
    {
      title: "Pédagogie",
      links: [
        { href: "/school-years", label: "Années scolaires", icon: "history", show: direction },
        { href: "/classes", label: "Classes", icon: "school", show: staff },
        { href: "/students", label: "Élèves", icon: "graduation", show: pedagogy },
        { href: "/subjects", label: "Matières", icon: "book", show: pedagogy },
        { href: "/terms", label: "Périodes", icon: "calendar", show: staff },
        { href: "/assessments", label: "Notes et évaluations", icon: "clipboard", show: pedagogy },
        { href: "/sessions", label: "Séances et présences", icon: "calendarCheck", show: pedagogy },
      ],
    },
    {
      title: "Personnel",
      links: [
        { href: "/teachers", label: "Enseignants", icon: "presentation", show: staff },
        { href: "/users", label: "Utilisateurs", icon: "users", show: staff },
        { href: "/payroll", label: "Paie", icon: "wallet", show: pedagogy },
      ],
    },
    {
      title: "Mon espace",
      links: [
        { href: `/students/${studentId}`, label: "Mon dossier", icon: "folder", show: !!studentId },
        { href: `/students/${studentId}/notes`, label: "Mes notes", icon: "fileText", show: !!studentId },
        { href: `/students/${studentId}/bulletin`, label: "Mon bulletin", icon: "award", show: !!studentId },
      ],
    },
    {
      title: "Système",
      links: [{ href: "/settings", label: "Paramètres", icon: "settings", show: true }],
    },
  ];

  const allVisible = sections.flatMap((s) => s.links.filter((l) => l.show));
  const activeHref = allVisible
    .filter((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const close = () => setOpen(false);
  const roleLabel = ROLE_LABEL[user.role] ?? user.role;
  const sameAsRole = user.name.trim().toLowerCase() === roleLabel.toLowerCase();

  return (
    <>
      <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={close} aria-hidden="true" />
      <aside id="sidebar" className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Icon name="school" size={20} />
          </span>
          École lumière
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Fermer le menu">
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Menu principal">
          {sections.map((section, idx) => {
            const visibleLinks = section.links.filter((l) => l.show);
            if (visibleLinks.length === 0) return null;
            return (
              <div key={idx} className="nav-section">
                {section.title && <div className="nav-section-title">{section.title}</div>}
                {visibleLinks.map((l) => {
                  const active = l.href === activeHref;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={active ? "active" : ""}
                      aria-current={active ? "page" : undefined}
                      onClick={close}
                    >
                      <span className="nav-icon">
                        <Icon name={l.icon} size={18} />
                      </span>
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link
            href="/account"
            className="user-chip user-chip-link"
            onClick={close}
            title="Modifier mon compte"
            aria-label="Modifier mon compte"
          >
            <span className="user-avatar">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" />
              ) : (
                <Icon name="user" size={20} />
              )}
            </span>
            <div className="user-meta">
              <strong title={user.name}>{user.name}</strong>
              {!sameAsRole && <span>{roleLabel}</span>}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
