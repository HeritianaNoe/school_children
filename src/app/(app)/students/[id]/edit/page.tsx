import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateStudent } from "@/app/actions/students";
import StudentForm from "@/components/StudentForm";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const s = await prisma.student.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!s) notFound();
  const classes = await prisma.classe.findMany({ include: { schoolYear: true }, orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }] });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier le dossier</h1>
          <p>
            {s.lastName.toUpperCase()} {s.firstName} — matricule {s.matricule}
          </p>
        </div>
        <Link href={`/students/${s.id}`} className="btn-secondary btn">
          ← Retour au dossier
        </Link>
      </div>
      <StudentForm
        action={updateStudent}
        classes={classes}
        student={{ ...s, email: s.user.email }}
        submitLabel="Enregistrer les modifications"
        cancelHref={`/students/${s.id}`}
      />
    </>
  );
}
