import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { getMaxStudentsPerClass } from "./settings";

/** Étiquette de cache : à invalider quand des élèves ou des classes changent. */
export const CAPACITY_TAG = "capacity-alerts";

export type OverCapacityClass = { id: string; name: string; year: string; count: number; max: number };

/**
 * Classes de l'année scolaire courante dont l'effectif dépasse le maximum autorisé.
 * Une seule requête groupée (index sur Student.classeId) + une petite requête sur les classes concernées ;
 * le résultat est mis en cache et invalidé à chaque inscription / modification / suppression d'élève.
 * Sans année courante définie, toutes les classes sont contrôlées.
 */
export const getOverCapacityClasses = unstable_cache(
  async (): Promise<OverCapacityClass[]> => {
    try {
      const max = await getMaxStudentsPerClass();
      const groups = await prisma.student.groupBy({
        by: ["classeId"],
        where: { classe: { schoolYear: { isCurrent: true } } },
        _count: { _all: true },
        having: { classeId: { _count: { gt: max } } },
      });
      if (groups.length === 0) {
        // Aucune classe en dépassement dans l'année courante. Si aucune année n'est courante, on contrôle tout.
        const hasCurrent = await prisma.schoolYear.count({ where: { isCurrent: true } });
        if (hasCurrent > 0) return [];
        const all = await prisma.student.groupBy({
          by: ["classeId"],
          _count: { _all: true },
          having: { classeId: { _count: { gt: max } } },
        });
        return await describe(all, max);
      }
      return await describe(groups, max);
    } catch {
      return [];
    }
  },
  ["capacity:over-classes"],
  { tags: [CAPACITY_TAG], revalidate: 60 }
);

async function describe(groups: { classeId: string; _count: { _all: number } }[], max: number) {
  if (groups.length === 0) return [];
  const classes = await prisma.classe.findMany({
    where: { id: { in: groups.map((g) => g.classeId) } },
    select: { id: true, name: true, schoolYear: { select: { name: true } } },
  });
  const byId = new Map(classes.map((c) => [c.id, c]));
  return groups
    .map((g) => {
      const c = byId.get(g.classeId);
      return c ? { id: c.id, name: c.name, year: c.schoolYear.name, count: g._count._all, max } : null;
    })
    .filter((x): x is OverCapacityClass => x !== null)
    .sort((a, b) => b.count - b.max - (a.count - a.max) || a.name.localeCompare(b.name));
}
