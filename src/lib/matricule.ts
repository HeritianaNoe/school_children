import { prisma } from "./prisma";

/** « 2026-2027 » → « M26 » */
export function matriculePrefix(year: string) {
  const m = /(\d{4})/.exec(year);
  const yy = (m ? m[1] : String(new Date().getFullYear())).slice(2);
  return `M${yy}`;
}

/** Prochain matricule libre de l'année : M26-001, M26-002, … (numérotation continue, pas de limite à 999). */
export async function nextMatricule(year: string) {
  const prefix = matriculePrefix(year);
  const rows = await prisma.student.findMany({
    where: { matricule: { startsWith: `${prefix}-` } },
    select: { matricule: true },
  });
  let max = 0;
  for (const r of rows) {
    const n = parseInt(r.matricule.slice(prefix.length + 1), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
