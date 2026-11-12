import Link from "next/link";
import { studentImageUrl } from "@/lib/avatar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { deleteStudent } from "@/app/actions/students";
import { fmtDateFull } from "@/lib/format";
import { SEX_LABEL, NOMENCLATURE_LABEL } from "@/lib/labels";
import { forbidden } from "@/lib/flash";
import ConfirmButton from "@/components/ConfirmButton";
import PdfLink from "@/components/PdfLink";

export default async function StudentPage({
  params: paramsP,
  searchParams: searchParamsP,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await paramsP;
  const searchParams = await searchParamsP;
  const u = await requireUser();
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, classe: { include: { schoolYear: true } } },
  });
  if (!s) notFound();
  if (u.role === "STUDENT" && s.userId !== u.id) forbidden();
  const staffView = u.role !== "STUDENT";
  const canManage = u.role === "ADMIN" || u.role === "DIRECTOR";
  const canFiche = u.role === "ADMIN" || u.role === "DIRECTOR" || u.role === "TEACHER"; // fiche d'inscription (l'élève voit la sienne)

  const sexLabel = s.sex ? SEX_LABEL[s.sex] : "—";

  return (
    <>
      {searchParams.created && (
        <div className="card" style={{ background: "#d1fae5", borderColor: "#6ee7b7", marginBottom: 16 }}>
          Élève inscrit avec succès. Matricule attribué : <strong>{s.matricule}</strong>.{" "}
          {canFiche && <Link href={`/students/${s.id}/fiche`}>Fiche d&apos;inscription (PDF) →</Link>}
        </div>
      )}

      <div className="page-header">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={studentImageUrl(s)} alt="" className="photo-preview" style={{ width: 72, height: 86 }} />
          <div>
            <h1>
              {s.lastName.toUpperCase()} {s.firstName}
            </h1>
            <p>
              {s.matricule} · {s.classe.name} ({s.classe.schoolYear.name}) · {NOMENCLATURE_LABEL[s.nomenclature]} · {sexLabel}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canFiche && (
            <Link href={`/students/${s.id}/fiche`} className="btn">
              Fiche d&apos;inscription
            </Link>
          )}
          <Link href={`/students/${s.id}/dossier`} className="btn-secondary btn">
            Dossier d&apos;élève
          </Link>
          <Link href={`/students/${s.id}/notes`} className="btn-secondary btn">
            Notes par matière
          </Link>
          <Link href={`/students/${s.id}/bulletin`} className="btn-secondary btn">
            Bulletin
          </Link>
          {canManage && (
            <Link href={`/students/${s.id}/edit`} className="btn-secondary btn">
              Modifier
            </Link>
          )}
          {staffView && (
            <Link href="/students" className="btn-secondary btn">
              Liste des élèves
            </Link>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>Informations personnelles</h3>
        <div className="form-grid">
          <div>
            <span className="muted">Date de naissance</span>
            <div>{fmtDateFull(s.birthDate)}</div>
          </div>
          <div>
            <span className="muted">Lieu de naissance</span>
            <div>{s.birthPlace || "—"}</div>
          </div>
          <div>
            <span className="muted">Adresse</span>
            <div>{s.address || "—"}</div>
          </div>
          <div>
            <span className="muted">Téléphone</span>
            <div>{s.phone || "—"}</div>
          </div>
          <div>
            <span className="muted">Parent / Tuteur</span>
            <div>{s.parentName || "—"}</div>
          </div>
          <div>
            <span className="muted">Téléphone du parent</span>
            <div>{s.parentPhone || "—"}</div>
          </div>
          <div>
            <span className="muted">Date d&apos;inscription</span>
            <div>{fmtDateFull(s.registeredAt)}</div>
          </div>
          <div>
            <span className="muted">Compte de connexion</span>
            <div>{s.user.email}</div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}>
        {(canFiche || !staffView) && (
          <PdfLink href={`/api/students/${s.id}/fiche`} title="Télécharger la fiche d'inscription en PDF" />
        )}
      </div>

      {canManage && (
        <div className="card danger-zone" style={{ marginTop: 32 }}>
          <strong>Supprimer ce dossier</strong>
          <p className="muted" style={{ margin: "6px 0 12px" }}>
            Supprime l&apos;élève, son compte, ses notes, ses présences et ses commentaires. Cette action est définitive.
          </p>
          <form action={deleteStudent}>
            <input type="hidden" name="id" value={s.id} />
            <ConfirmButton
              message={`Supprimer définitivement le dossier de ${s.firstName} ${s.lastName} (${s.matricule}) ? Cette action est irréversible.`}
            >
              Supprimer l&apos;élève
            </ConfirmButton>
          </form>
        </div>
      )}
    </>
  );
}
