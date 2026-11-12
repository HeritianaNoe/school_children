"use client";

import { useEffect, useState } from "react";
import { THEMES, THEME_STORAGE_KEY, applyTheme, type ThemeId } from "@/lib/theme";
import Icon from "./Icons";

/**
 * Choix du thème de l'application (page Paramètres > Apparence).
 * Le thème s'applique tout de suite et est mémorisé dans ce navigateur (localStorage) ;
 * <ThemeScript /> le réapplique avant l'affichage à chaque visite.
 */
export default function AppearancePicker() {
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
    <div className="theme-grid" role="radiogroup" aria-label="Thème de l'application">
      {THEMES.map((t) => {
        const active = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`theme-card ${active ? "active" : ""}`}
            onClick={() => choose(t.id)}
          >
            {/* Aperçu : menu latéral, barre du haut et bouton aux couleurs du thème */}
            <span className="theme-preview" aria-hidden="true">
              <span className="tp-side" style={{ background: t.navy }}>
                <i style={{ background: t.primary }} />
                <i />
                <i />
              </span>
              <span className="tp-main">
                <span className="tp-bar" />
                <span className="tp-card" style={{ background: t.soft }}>
                  <b style={{ background: t.primary }} />
                </span>
              </span>
            </span>
            <span className="theme-card-label">
              <span>
                <strong>{t.label}</strong>
                <small>{t.hint}</small>
              </span>
              {active && (
                <span className="theme-card-check" style={{ background: t.primary }}>
                  <Icon name="check" size={14} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
