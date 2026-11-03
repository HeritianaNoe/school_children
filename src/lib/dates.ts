// Semaine ISO : du lundi au dimanche
export function weekRange(ref = new Date()) {
  const start = new Date(ref);
  const day = (start.getDay() + 6) % 7; // 0 = lundi
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function weekKey(ref = new Date()) {
  const { start } = weekRange(ref);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${start.getFullYear()}-${p(start.getMonth() + 1)}-${p(start.getDate())}`;
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}
