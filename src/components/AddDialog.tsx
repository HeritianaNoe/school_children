"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Icon, { type IconName } from "@/components/Icons";

/**
 * Bouton qui ouvre un formulaire d'ajout dans une boîte de dialogue (modale).
 *
 * - Le formulaire (avec son action serveur) est passé en `children` et reste rendu côté serveur.
 * - Fermeture : bouton ✕, touche Échap, ou tout élément portant l'attribut `data-dialog-close`
 *   (ex. un bouton « Annuler »). Un clic à côté ne ferme pas la boîte, pour ne pas perdre la saisie.
 * - Après l'envoi, l'action serveur redirige avec ?ok=… ou ?err=… : la boîte se ferme alors toute seule
 *   et <FlashToast /> affiche le résultat.
 */
export default function AddDialog({
  label,
  title,
  children,
  maxWidth = 560,
  disabled,
  className = "btn",
  icon = "plus",
  iconOnly = false,
}: {
  /** Texte du bouton d'ouverture */
  label: string;
  /** Titre de la boîte de dialogue */
  title: string;
  children: ReactNode;
  maxWidth?: number;
  disabled?: boolean;
  className?: string;
  /** Icône du bouton d'ouverture (« plus » par défaut) */
  icon?: IconName;
  /** Bouton réduit à l'icône (le libellé reste utilisé comme info-bulle) */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const sp = useSearchParams();
  const flash = sp.get("ok") || sp.get("err");

  // Résultat de l'action serveur : on referme la boîte
  useEffect(() => {
    if (flash) setOpen(false);
  }, [flash]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    // Focus sur le premier champ du formulaire
    dialogRef.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([type=checkbox]), select, textarea")?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
        {...(iconOnly ? { title: label, "aria-label": label } : {})}
      >
        <Icon name={icon} size={16} />
        {!iconOnly && label}
      </button>

      {open &&
        createPortal(
          <div className="confirm-overlay no-print">
            <div
              ref={dialogRef}
              className="modal-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              style={{ maxWidth }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-dialog-close]")) setOpen(false);
              }}
            >
              <div className="modal-header">
                <h3>{title}</h3>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  aria-label="Fermer"
                  title="Fermer"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">{children}</div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
