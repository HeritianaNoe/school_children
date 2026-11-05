export const fmtDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });
export const fmtDateFull = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
export const fmtAr = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " Ar";

const p2 = (n: number) => String(n).padStart(2, "0");
export const toLocalInput = (d: Date | null | undefined) => {
  if (!d) return "";
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
/** Valeur pour <input type="date"> */
export const toDateInput = (d: Date | null | undefined) => {
  if (!d) return "";
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};
/** Valeur pour <input type="time"> (HH:MM, heure locale) */
export const toTimeInput = (d: Date | null | undefined) => {
  if (!d) return "";
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
/** « 2026-11-02 » → Date à midi (heure locale) : évite les décalages de jour liés au fuseau horaire. */
export const parseDateInput = (s: string) => new Date(`${s}T12:00:00`);

/** Colonnes PostgreSQL DATE (stockées à minuit UTC) : lecture en UTC pour éviter un décalage de jour. */
export const toUtcDateInput = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
export const fmtUtcDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }) : "—";
