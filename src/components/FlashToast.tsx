"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MESSAGES } from "@/lib/messages";

/**
 * Affiche le message de confirmation / d'erreur transmis par ?ok=… ou ?err=…
 * dans une boîte de dialogue centrée (remplace alert()), puis nettoie l'URL.
 */
export default function FlashToast() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  const ok = sp.get("ok");
  const err = sp.get("err");

  useEffect(() => {
    if (!ok && !err) return;
    const dict = (err ? MESSAGES.err : MESSAGES.ok) as Record<string, string>;
    const text = dict[(err ?? ok) as string] ?? (err ? MESSAGES.err.generic : undefined);
    if (text) setToast({ kind: err ? "err" : "ok", text });

    const params = new URLSearchParams(sp.toString());
    params.delete("ok");
    params.delete("err");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, err]);

  useEffect(() => {
    if (!toast) return;
    okRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "Enter") && setToast(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [toast]);

  if (!toast) return null;
  const isErr = toast.kind === "err";

  return createPortal(
    <div className="confirm-overlay no-print" onClick={() => setToast(null)}>
      <div
        className={`confirm-dialog flash-dialog ${toast.kind}`}
        role={isErr ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="flash-title"
        aria-describedby="flash-message"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="confirm-icon" aria-hidden="true">
          {isErr ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m8 12.5 3 3 5-6" />
            </svg>
          )}
        </span>
        <h2 id="flash-title">{isErr ? "Erreur" : "Succès"}</h2>
        <p id="flash-message">{toast.text}</p>
        <div className="confirm-actions">
          <button type="button" ref={okRef} onClick={() => setToast(null)}>
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
