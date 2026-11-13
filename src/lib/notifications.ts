import { prisma } from "@/lib/prisma";

export type TeacherAlert = {
  id: string;
  nom: string;
  status: string;
  sansContrat: boolean;
  sansPaie: boolean;
};

/**
 * Enseignants izay tsy manana contrat na tsy manana fiche de paie.
 * Ny farany nampidirina no aloha.
 */
export async function getTeacherAlerts(limit = 30): Promise<{ total: number; items: TeacherAlert[] }> {
  const where = {
    OR: [
      { contracts: { none: {} } },
      { payslips: { none: {} } },
    ],
  };

  const [total, rows] = await Promise.all([
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      orderBy: { user: { name: "asc" } },
      take: limit,
      select: {
        id: true,
        status: true,
        user: { select: { name: true } },
        _count: {
          select: {
            contracts: true,
            payslips: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    items: rows.map((t) => ({
      id: t.id,
      nom: t.user.name,
      status: t.status,
      sansContrat: t._count.contracts === 0,
      sansPaie: t._count.payslips === 0,
    })),
  };
}