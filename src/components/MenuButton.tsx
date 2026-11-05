"use client";

import { useEffect, useState } from "react";
import Icon from "./Icons";

/**
 * Bouton « Menu » placé en haut du contenu (visible uniquement sur mobile).
 * Il dialogue avec <Nav /> par événements : Nav garde l'état ouvert/fermé du menu.
 */
export default function MenuButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onState = (e: Event) => setOpen(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("sidebar-state", onState);
    return () => window.removeEventListener("sidebar-state", onState);
  }, []);

  return (
    <div className="content-menu no-print">
      <button
        type="button"
        className="menu-toggle"
        onClick={() => window.dispatchEvent(new Event("sidebar-toggle"))}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="sidebar"
      >
        <Icon name="menu" size={20} />
      </button>
    </div>
  );
}
