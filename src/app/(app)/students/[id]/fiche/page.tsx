import Link from "next/link";
import { studentImageUrl } from "@/lib/avatar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import PrintButton from "@/components/PrintButton";
import { fmtDateFull } from "@/lib/format";
import { SEX_LABEL_LONG, NOMENCLATURE_LABEL } from "@/lib/labels";

export default async function FichePage({ params }: { params: { id: string } }) {
  await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, classe: { include: { schoolYear: true } } },
  });
  if (!s) notFound();

  const sexLabel = s.sex ? SEX_LABEL_LONG[s.sex] : "—";

  return (
    <>
      <div className="page-header no-print">
        <div>
          <h1>Fiche d&apos;inscription</h1>
          <p>
            {s.lastName.toUpperCase()} {s.firstName} — {s.matricule}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={`/api/students/${s.id}/fiche`} className="btn">
            Télécharger le PDF
          </a>
          <PrintButton label="Imprimer" />
          <Link href={`/students/${s.id}`} className="btn-secondary btn">
            ← Retour
          </Link>
        </div>
      </div>

      <article className="fiche">
        <header className="fiche-header">
          <div>
            <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
              ÉTABLISSEMENT SCOLAIRE
            </div>
            <h1>FICHE D&apos;INSCRIPTION</h1>
            <p style={{ marginTop: 8 }}>
              Année scolaire <strong>{s.classe.schoolYear.name}</strong>
            </p>
            <p>
              Matricule : <strong>{s.matricule}</strong>
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={studentImageUrl(s)} alt="Photo de l'élève" className="fiche-photo" />
        </header>

        <h3 style={{ marginBottom: 14, color: "#0f172a" }}>Identité de l&apos;élève</h3>
        <div className="fiche-grid">
          <div className="fiche-field">
            <label>Nom</label>
            <div>{s.lastName.toUpperCase()}</div>
          </div>
          <div className="fiche-field">
            <label>Prénom</label>
            <div>{s.firstName}</div>
          </div>
          <div className="fiche-field">
            <label>Date de naissance</label>
            <div>{fmtDateFull(s.birthDate)}</div>
          </div>
          <div className="fiche-field">
            <label>Lieu de naissance</label>
            <div>{s.birthPlace || "—"}</div>
          </div>
          <div className="fiche-field">
            <label>Sexe</label>
            <div>{sexLabel}</div>
          </div>
          <div className="fiche-field">
            <label>Date d&apos;inscription</label>
            <div>{fmtDateFull(s.registeredAt)}</div>
          </div>
        </div>

        <h3 style={{ margin: "28px 0 14px", color: "#0f172a" }}>Coordonnées</h3>
        <div className="fiche-grid">
          <div className="fiche-field" style={{ gridColumn: "1 / -1" }}>
            <label>Adresse</label>
            <div>{s.address || "—"}</div>
          </div>
          <div className="fiche-field">
            <label>Téléphone de l'élève</label>
            <div>{s.phone || "—"}</div>
          </div>
          <div className="fiche-field">
            <label>Adresse e-mail</label>
            <div>{s.user.email}</div>
          </div>
        </div>

        <h3 style={{ margin: "28px 0 14px", color: "#0f172a" }}>Parent / Tuteur</h3>
        <div className="fiche-grid">
          <div className="fiche-field">
            <label>Nom du parent ou tuteur</label>
            <div>{s.parentName || "—"}</div>
          </div>
          <div className="fiche-field">
            <label>Téléphone du parent</label>
            <div>{s.parentPhone || "—"}</div>
          </div>
        </div>

        <h3 style={{ margin: "28px 0 14px", color: "#0f172a" }}>Scolarité</h3>
        <div className="fiche-grid">
          <div className="fiche-field">
            <label>Classe</label>
            <div>{s.classe.name}</div>
          </div>
          <div className="fiche-field">
            <label>Année scolaire</label>
            <div>{s.classe.schoolYear.name}</div>
          </div>
          <div className="fiche-field">
            <label>Nomenclature</label>
            <div>{NOMENCLATURE_LABEL[s.nomenclature]}</div>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            fontSize: "0.9rem",
          }}
        >
          <div>
            <div className="muted">Signature du parent / tuteur</div>
            <div style={{ borderBottom: "1px solid #94a3b8", height: 48, marginTop: 8 }} />
          </div>
          <div>
            <div className="muted">Cachet et signature de l&apos;établissement</div>
            <div style={{ borderBottom: "1px solid #94a3b8", height: 48, marginTop: 8 }} />
          </div>
        </div>

        <p className="muted" style={{ marginTop: 32, fontSize: "0.78rem", textAlign: "center" }}>
          Document généré le {fmtDateFull(new Date())} — Gestion scolaire
        </p>
      </article>
    </>
  );
}
