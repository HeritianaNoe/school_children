/**
 * Applique la règle « un compte élève / enseignant n'est actif que dans l'année courante » aux données EXISTANTES.
 * À lancer une seule fois si l'année courante a déjà été changée avant cette mise à jour :
 *   npm run students:sync
 * (Ensuite, la synchronisation est automatique à chaque changement d'année courante.)
 */
import { PrismaClient } from "@prisma/client";
import { syncStudentAccountsForYear, syncTeacherAccountsForYear } from "../src/lib/enrollment";
import { ensureContractsForYear } from "../src/lib/contracts";

const prisma = new PrismaClient();

async function main() {
  const current = await prisma.schoolYear.findFirst({ where: { isCurrent: true } });
  if (!current) {
    console.log("Aucune année scolaire courante : rien à faire.");
    return;
  }
  const r = await syncStudentAccountsForYear(prisma, current.id);
  const t = await syncTeacherAccountsForYear(prisma, current.id);
  console.log(`Année courante ${current.name} :`);
  console.log(`  élèves       : ${r.deactivated} désactivé(s), ${r.activated} activé(s)`);
  console.log(`  enseignants  : ${t.deactivated} désactivé(s), ${t.activated} activé(s)`);
  const c = await ensureContractsForYear(prisma, current.id);
  console.log(`  contrats     : ${c} créé(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
