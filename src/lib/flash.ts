import { redirect } from "next/navigation";
import type { ErrKey, OkKey } from "./messages";

/** Construit une URL portant un message de confirmation (ok) ou d'erreur (err). */
export function flashUrl(path: string, kind: "ok" | "err", key: OkKey | ErrKey) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${kind}=${key}`;
}

export function done(path: string, key: OkKey): never {
  redirect(flashUrl(path, "ok", key));
}

export function fail(path: string, key: ErrKey): never {
  redirect(flashUrl(path, "err", key));
}

/** Accès refusé : retour au tableau de bord avec un message. */
export function forbidden(): never {
  redirect(flashUrl("/dashboard", "err", "forbidden"));
}
