/**
 * Contraintes PostgreSQL que Prisma ne sait pas exprimer dans schema.prisma.
 * Lancé automatiquement après « prisma db push » (voir package.json). Idempotent.
 *
 *  - une seule année scolaire courante (index unique partiel)
 *  - date de fin postérieure à la date de début
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_current_school_year ON school_years (is_current) WHERE is_current = TRUE`
  );
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dates') THEN
        ALTER TABLE school_years ADD CONSTRAINT chk_dates CHECK (end_date > start_date);
      END IF;
    END $$;
  `);
  console.log("✔ Contraintes school_years appliquées (idx_current_school_year, chk_dates).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
