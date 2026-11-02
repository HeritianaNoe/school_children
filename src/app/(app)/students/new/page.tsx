import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createStudent } from "@/app/actions/students";

export default async function NewStudentPage() {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const classes = await prisma.classe.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inscription d&apos;un élève</h1>
          <p>Le matricule sera généré automatiquement</p>
        </div>
        <Link href="/students" className="btn-secondary">
          ← Retour à la liste
        </Link>
      </div>

      <form action={createStudent}>
        <div className="form-section">
          <h3>Identité de l&apos;élève</h3>
          <div className="form-grid">
            <label>
              Nom *
              <input name="lastName" required maxLength={80} placeholder="RAKOTO" />
            </label>
            <label>
              Prénom *
              <input name="firstName" required maxLength={80} placeholder="Jean" />
            </label>
            <label>
              Date de naissance
              <input name="birthDate" type="date" />
            </label>
            <label>
              Lieu de naissance
              <input name="birthPlace" maxLength={120} placeholder="Antananarivo" />
            </label>
            <label>
              Sexe
              <select name="sex">
                <option value="">— Sélectionner —</option>
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </label>
            <label>
              Photo (URL)
              <input name="photoUrl" type="url" placeholder="https://…" />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Coordonnées</h3>
          <div className="form-grid">
            <label>
              Adresse
              <input name="address" maxLength={255} placeholder="Lot II …" />
            </label>
            <label>
              Téléphone élève
              <input name="phone" maxLength={40} placeholder="+261 34 …" />
            </label>
            <label>
              Nom du parent / tuteur
              <input name="parentName" maxLength={120} />
            </label>
            <label>
              Téléphone du parent
              <input name="parentPhone" maxLength={40} />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Scolarité</h3>
          <div className="form-grid">
            <label>
              Classe et année scolaire *
              <select name="classeId" required>
                <option value="">— Choisir une classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.year})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email de connexion (optionnel)
              <input name="email" type="email" placeholder="sera généré si vide" />
            </label>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Mot de passe initial : <code>eleve123</code> — à changer à la première connexion.
          </p>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-success">
            Enregistrer l&apos;inscription
          </button>
          <Link href="/students" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
