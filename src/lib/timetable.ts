export const DAYS = [
  { n: 1, label: "Lundi" },
  { n: 2, label: "Mardi" },
  { n: 3, label: "Mercredi" },
  { n: 4, label: "Jeudi" },
  { n: 5, label: "Vendredi" },
  { n: 6, label: "Samedi" },
] as const;

const p2 = (n: number) => String(n).padStart(2, "0");

/** « AAAA-MM-JJ » en heure locale. */
export const isoDay = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

/** Lundi (00:00, heure locale) de la semaine qui contient le jour donné (AAAA-MM-JJ) ; semaine en cours si absent ou invalide. */
export function mondayOf(value?: string | null): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** Date et heure réelles d'un créneau pour la semaine commençant à `monday`. */
export function slotDate(monday: Date, dayOfWeek: number, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayOfWeek - 1, h, m, 0, 0);
}
