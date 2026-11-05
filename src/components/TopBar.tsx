"use client";

import { useEffect, useState } from "react";
import { logout } from "@/app/actions/auth";
import Icon from "./Icons";

/**
 * Barre supérieure du contenu : bouton menu (gauche) + déconnexion (droite).
 * Dialogue avec <Nav /> via événements pour ouvrir / fermer la sidebar.
 */
export default function TopBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onState = (e: Event) => setOpen(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("sidebar-state", onState);
    return () => window.removeEventListener("sidebar-state", onState);
  }, []);

  return (
    <div 
      className="topbar no-print bg-white flex items-center justify-between shadow-sm" 
      style={{ 
        backgroundColor: "#ffffff", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        paddingTop: "0.15rem",
        paddingBottom: "0.4rem"
      }}
    >
      <button
        type="button"
        className="menu-toggle flex items-center justify-center"
        onClick={() => window.dispatchEvent(new Event("sidebar-toggle"))}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="sidebar"
        title={open ? "Masquer le menu" : "Afficher le menu"}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          transform: "translateY(1px)" // Natao hiakatra kokoa
        }}
      >
        <Icon name={open ? "close" : "menu"} size={20} />
      </button>

      <form action={logout} className="topbar-logout flex items-center" style={{ display: "flex", alignItems: "center" }}>
        <button 
          type="submit" 
          className="btn-secondary btn-sm logout-btn topbar-logout-btn flex items-center" 
          style={{ 
            display: "flex", 
            alignItems: "center",
           transform: "translateY(1px)" // Natao hiakatra kokoa koa ny an'ny logout
          }}
        >
          <Icon name="logout" size={16} />
          <span className="logout-label">Se déconnecter</span>
        </button>
      </form>
    </div>
  );
}