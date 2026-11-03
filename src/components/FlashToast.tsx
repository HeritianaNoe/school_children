"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MESSAGES } from "@/lib/messages";

/** Affiche le message de confirmation / d'erreur transmis par ?ok=… ou ?err=…, puis nettoie l'URL. */
export default function FlashToast() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

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
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <div className={`toast ${toast.kind} no-print`} role={toast.kind === "err" ? "alert" : "status"}>
      <span>{toast.text}</span>
      <button type="button" className="toast-close" onClick={() => setToast(null)} aria-label="Fermer">
        ×
      </button>
    </div>
  );
}
