export const fmtDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });
export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
export const fmtAr = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " Ar";
export const toLocalInput = (d: Date | null | undefined) => {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
