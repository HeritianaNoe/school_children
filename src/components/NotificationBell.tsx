"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icons";

export type BellAlert = { id: string; name: string; year: string; count: number; max: number };
export type BellLowGrade = { studentId: string; name: string; classe: string; count: number; lowest: number };
export type BellAbsence = { studentId: string; name: string; classe: string; days: number };

const SHOWN = 15; // lignes affichées par rubrique (le badge compte tout)

/**
 * Cloche d'alertes (à côté de « Se déconnecter »), toujours visible. Le badge rouge n'apparaît que s'il y a
 * des alertes : classes au-dessus de l'effectif maximum, élèves avec une note < 5/20, élèves absents > 3 jours.
 */
export default function NotificationBell({
  classes,
  max,
  lowGrades,
  absences,
  canConfigure,
}: {
  classes: BellAlert[];
  max: number;
  lowGrades: BellLowGrade[];
  absences: BellAbsence[];
  canConfigure: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const total = classes.length + lowGrades.length + absences.length;
  const label = total > 0 ? `${total} alerte${total > 1 ? "s" : ""}` : "Notifications : aucune alerte";
  const close = () => setOpen(false);

  return (
    <div className="bell" ref={box}>
      <button
        type="button"
        className="bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        title={label}
      >
        <Icon name="bell" size={18} />
        {total > 0 && <span className="bell-badge">{total > 99 ? "99+" : total}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="dialog" aria-label="Alertes">
          <div className="bell-head">
            <strong>Notifications</strong>
            <span className="muted">{total > 0 ? label : "Aucune notification pour le moment."}</span>
          </div>

          <div className="bell-scroll">
            {classes.length > 0 && (
              <Section title={`Effectif au-dessus de ${max} élèves`} count={classes.length}>
                {classes.slice(0, SHOWN).map((a) => (
                  <Row key={a.id} href={`/classes/${a.id}`} onClick={close} title={a.name} sub={a.year} value={`${a.count} / ${a.max}`} extra={`+${a.count - a.max}`} />
                ))}
              </Section>
            )}
            {lowGrades.length > 0 && (
              <Section title="Note inférieure à 5 / 20" count={lowGrades.length}>
                {lowGrades.slice(0, SHOWN).map((g) => (
                  <Row
                    key={g.studentId}
                    href={`/students/${g.studentId}/notes`}
                    onClick={close}
                    title={g.name}
                    sub={`${g.classe} · ${g.count} note${g.count > 1 ? "s" : ""}`}
                    value={`${String(g.lowest).replace(".", ",")} / 20`}
                  />
                ))}
              </Section>
            )}
            {absences.length > 0 && (
              <Section title="Absent plus de 3 jours (30 derniers jours)" count={absences.length}>
                {absences.slice(0, SHOWN).map((a) => (
                  <Row key={a.studentId} href={`/students/${a.studentId}`} onClick={close} title={a.name} sub={a.classe} value={`${a.days} jours`} />
                ))}
              </Section>
            )}
          </div>

          {canConfigure && (
            <Link href="/settings" className="bell-foot" onClick={close}>
              <Icon name="settings" size={15} />
              Paramètres
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bell-section">
      <div className="bell-section-title">
        {title}
        <span>{count}</span>
      </div>
      <ul className="bell-list">{children}</ul>
      {count > SHOWN && <p className="bell-more">+ {count - SHOWN} autre{count - SHOWN > 1 ? "s" : ""}</p>}
    </div>
  );
}

function Row({
  href,
  onClick,
  title,
  sub,
  value,
  extra,
}: {
  href: string;
  onClick: () => void;
  title: string;
  sub: string;
  value: string;
  extra?: string;
}) {
  return (
    <li>
      <Link href={href} onClick={onClick}>
        <span>
          <strong>{title}</strong>
          <small>{sub}</small>
        </span>
        <span className="bell-count">
          {value}
          {extra && <em>{extra}</em>}
        </span>
      </Link>
    </li>
  );
}
