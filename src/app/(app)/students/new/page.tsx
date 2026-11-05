import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createStudent } from "@/app/actions/students";
import StudentForm from "@/components/StudentForm";

export default async function NewStudentPage() {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const classes = await prisma.classe.findMany({ include: { schoolYear: true }, orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }] });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inscription d&apos;un élève</h1>
          <p>Le matricule est généré automatiquement.</p>
        </div>
        <Link href="/students" className="btn-secondary btn">
          ← Retour à la liste
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="card">
          <strong>Aucune classe n&apos;existe pour le moment.</strong>
          <p className="muted" style={{ margin: "6px 0 12px" }}>
            Créez d&apos;abord une classe (et son année scolaire) avant d&apos;inscrire des élèves.
          </p>
          <Link href="/classes" className="btn">
            Créer une classe
          </Link>
        </div>
      ) : (
        <StudentForm
          action={createStudent}
          classes={classes}
          submitLabel="Enregistrer l'inscription"
          cancelHref="/students"
        />
      )}
    </>
  );
}
