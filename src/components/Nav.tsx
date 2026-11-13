"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/lib/labels";
import { ROLES, hasRole, canAccessResource, resourceForHref, type ResourceKey } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session";
import Icon, { type IconName } from "./Icons";

type NavLink = { href: string; label: string; icon: IconName; show: boolean };
type NavSection = { title?: string; links: NavLink[] };

export default function Nav({
  user,
  studentId,
  avatarUrl,
  accessMap,
}: {
  user: SessionUser;
  studentId?: string | null;
  avatarUrl?: string | null;
  /** Overrides matrice d'accès ("ROLE:resource" → boolean) */
  accessMap?: Record<string, boolean>;
}) {
  const pathname = usePathname();
  // Mobile : menu fermé par défaut (tiroir). Desktop : la sidebar est toujours visible (voir globals.css)
  const [open, setOpen] = useState(false);
  const staff = hasRole(user.role, ROLES.STAFF);
  const pedagogy = hasRole(user.role, ROLES.PEDAGOGY);
  const direction = hasRole(user.role, ROLES.DIRECTION);

  /** Respecte la matrice d'accès (Paramètres) si fournie, sinon les groupes de rôles. */
  function allowed(href: string, fallback: boolean): boolean {
    const res = resourceForHref(href);
    if (!res || !accessMap) return fallback;
    return canAccessResource(user.role, res as ResourceKey, accessMap);
  }

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
        { href: "/dashboard", label: "Tableau de bord", icon: "dashboard", show: allowed("/dashboard", true) },
        { href: "/timetable", label: "Emploi du temps", icon: "calendar", show: allowed("/timetable", true) },
        { href: "/presents", label: "Élèves présents", icon: "users", show: allowed("/presents", true) },
        { href: "/announcements", label: "Annonces", icon: "megaphone", show: allowed("/announcements", true) },
        { href: "/reclamations", label: "Réclamations", icon: "alert", show: allowed("/reclamations", true) },
      ],
    },
    {
      title: "Pédagogie",
      links: [
        { href: "/school-years", label: "Années scolaires", icon: "history", show: allowed("/school-years", direction) },
        { href: "/classes", label: "Classes", icon: "school", show: allowed("/classes", staff) },
        { href: "/students", label: "Élèves", icon: "graduation", show: allowed("/students", pedagogy) },
        { href: "/subjects", label: "Matières", icon: "book", show: allowed("/subjects", pedagogy) },
        { href: "/terms", label: "Périodes", icon: "calendar", show: allowed("/terms", staff) },
        { href: "/assessments", label: "Notes et évaluations", icon: "clipboard", show: allowed("/assessments", pedagogy) },
        { href: "/sessions", label: "Séances et présences", icon: "calendarCheck", show: allowed("/sessions", pedagogy) },
      ],
    },
    {
      title: "Personnel",
      links: [
        { href: "/teachers", label: "Enseignants", icon: "presentation", show: allowed("/teachers", staff) },
        { href: "/users", label: "Utilisateurs", icon: "users", show: allowed("/users", staff) },
        { href: "/payroll", label: "Paie", icon: "wallet", show: allowed("/payroll", pedagogy) },
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
      links: [{ href: "/settings", label: "Paramètres", icon: "settings", show: allowed("/settings", true) }],
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
