import { prisma } from "@/lib/prisma";

export type EmployeAlert = {
  id: number;
  nom: string;
  matricule: string;
  dateEmbauche: string;
  sansContrat: boolean;
  sansPaie: boolean;
};

/**
 * Employés en poste (Actif / En congé) qui n'ont encore aucun contrat
 * ou aucune paie enregistrée. Les plus récemment embauchés d'abord.
 */
export async function getEmployeAlerts(limit = 30): Promise<{ total: number; items: EmployeAlert[] }> {
  const where = {
    statut: { in: ["ACTIF", "EN_CONGE"] as ("ACTIF" | "EN_CONGE")[] },
    OR: [{ contrats: { none: {} } }, { paies: { none: {} } }],
  };

  const [total, rows] = await Promise.all([
  prisma.teacher.count({ where }),
  prisma.teacher.findMany({
    where,
    orderBy: { /* ohatra user.name na createdAt */ },
    take: limit,
    select: {
      id: true,
      hourlyRate: true,
      status: true,
      user: {
        select: { name: true, email: true, phone: true }
      },
      _count: {
        select: {
          contracts: true,   // TeacherContract
          payslips: true,    // Payslip
        },
      },
    },
  }),
]);

  return {
    total,
    items: rows.map((e) => ({
      id: e.id,
      nom: `${e.prenom} ${e.nom}`,
      matricule: e.matricule,
      dateEmbauche: e.dateEmbauche.toISOString(),
      sansContrat: e._count.contrats === 0,
      sansPaie: e._count.paies === 0,
    })),
  };
}
