"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Bouton de soumission qui demande une confirmation (boîte de dialogue centrée, aux couleurs de
 * l'application) avant d'envoyer le formulaire auquel il est rattaché.
 */
export default function ConfirmButton({
  message,
  children,
  className = "btn-danger btn-sm",
  disabled,
  form,
  title,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
}: {
  message: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  form?: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const confirm = () => {
    setOpen(false);
    const trigger = triggerRef.current;
    // requestSubmit(trigger) reproduit exactement un clic sur le bouton (action serveur incluse)
    trigger?.form?.requestSubmit(trigger);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="submit"
        form={form}
        className={className}
        disabled={disabled}
        title={title}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </button>

      {open &&
        createPortal(
          <div className="confirm-overlay no-print" onClick={() => setOpen(false)}>
            <div
              className="confirm-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="confirm-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <h2 id="confirm-title">Confirmation</h2>
              <p id="confirm-message">{message}</p>
              <div className="confirm-actions">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  {cancelLabel}
                </button>
                <button type="button" ref={confirmRef} onClick={confirm}>
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
