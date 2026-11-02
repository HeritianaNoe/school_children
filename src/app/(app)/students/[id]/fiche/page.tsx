import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import PrintButton from "@/components/PrintButton";

export default async function FichePage({ params }: { params: { id: string } }) {
  await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, classe: true },
  });
  if (!s) notFound();

  const sexLabel = s.sex === "M" ? "Masculin" : s.sex === "F" ? "Féminin" : "—";

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
          <PrintButton label="Imprimer / Enregistrer en PDF" />
          <Link href={`/students/${s.id}`} className="btn-secondary">
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
              Année scolaire <strong>{s.classe.year}</strong>
            </p>
            <p>
              Matricule : <strong>{s.matricule}</strong>
            </p>
          </div>
          {s.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.photoUrl} alt="Photo élève" className="fiche-photo" />
          ) : (
            <div
              className="fiche-photo"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f1f5f9",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Photo
            </div>
          )}
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
            <div>{s.birthDate ? s.birthDate.toLocaleDateString("fr-FR") : "—"}</div>
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
            <div>{s.registeredAt.toLocaleDateString("fr-FR")}</div>
          </div>
        </div>

        <h3 style={{ margin: "28px 0 14px", color: "#0f172a" }}>Coordonnées</h3>
        <div className="fiche-grid">
          <div className="fiche-field" style={{ gridColumn: "1 / -1" }}>
            <label>Adresse</label>
            <div>{s.address || "—"}</div>
          </div>
          <div className="fiche-field">
            <label>Téléphone élève</label>
            <div>{s.phone || "—"}</div>
          </div>
          <div className="fiche-field">
            <label>Email</label>
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
            <div>{s.classe.year}</div>
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
          Document généré le {new Date().toLocaleDateString("fr-FR")} — Gestion Scolaire
        </p>
      </article>
    </>
  );
}
