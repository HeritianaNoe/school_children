"use client";

import { useEffect, useState } from "react";
import Icon from "./Icons";

export type ThemeId = "defaut" | "gris" | "vert" | "rouge";

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "defaut", label: "Par défaut", swatch: "#1d4ed8" },
  { id: "gris", label: "Gris foncé", swatch: "#374151" },
  { id: "vert", label: "Vert foncé", swatch: "#166534" },
  { id: "rouge", label: "Rouge foncé", swatch: "#991b1b" },
];

export const THEME_STORAGE_KEY = "ecole-theme";

function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  if (id === "defaut") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
}

/**
 * Menu « Paramètres » du sidebar : sous-menu repliable « Apparence » pour changer le thème.
 * Le choix est mémorisé dans localStorage ; <ThemeScript /> le réapplique avant l'affichage.
 */
export default function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("defaut");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) setTheme(saved);
    } catch {
      /* stockage indisponible : on garde le thème par défaut */
    }
  }, []);

  function choose(id: ThemeId) {
    setTheme(id);
    applyTheme(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="nav-section">
      <div className="nav-section-title">Paramètres</div>
      <button
        type="button"
        className={`nav-settings-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="theme-options"
      >
        <span className="nav-icon">
          <Icon name="settings" size={18} />
        </span>
        Apparence
        <span className="nav-chevron">
          <Icon name="chevronDown" size={16} />
        </span>
      </button>

      {open && (
        <div id="theme-options" className="theme-options" role="radiogroup" aria-label="Thème de l'application">
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`theme-option ${active ? "active" : ""}`}
                onClick={() => choose(t.id)}
              >
                <span className="theme-swatch" style={{ backgroundColor: t.swatch }} />
                {t.label}
                {active && (
                  <span className="theme-check">
                    <Icon name="check" size={15} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Script inline placé dans <head> : applique le thème enregistré avant le rendu (évite le flash). */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='gris'||t==='vert'||t==='rouge'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
