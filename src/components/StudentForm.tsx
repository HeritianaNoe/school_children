import Link from "next/link";
import { defaultAvatarUrl } from "@/lib/avatar";
import PhotoInput from "./PhotoInput";
import { toDateInput } from "@/lib/format";

type ClasseOpt = { id: string; name: string; year: string };
type StudentValues = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  birthPlace: string | null;
  sex: "M" | "F" | null;
  address: string | null;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  classeId: string;
  registeredAt: Date;
  photoUrl: string | null;
  email: string;
};

/** Formulaire d'inscription / de modification d'un élève. */
export default function StudentForm({
  action,
  classes,
  student,
  submitLabel,
  cancelHref,
}: {
  action: (fd: FormData) => void | Promise<void>;
  classes: ClasseOpt[];
  student?: StudentValues;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      {student && <input type="hidden" name="id" value={student.id} />}

      <div className="form-section">
        <h3>Identité de l&apos;élève</h3>
        <div className="form-grid">
          <label>
            Nom *
            <input name="lastName" required maxLength={80} placeholder="RAKOTO" defaultValue={student?.lastName} />
          </label>
          <label>
            Prénom *
            <input name="firstName" required maxLength={80} placeholder="Jean" defaultValue={student?.firstName} />
          </label>
          <label>
            Date de naissance
            <input name="birthDate" type="date" defaultValue={toDateInput(student?.birthDate)} />
          </label>
          <label>
            Lieu de naissance
            <input name="birthPlace" maxLength={120} placeholder="Antananarivo" defaultValue={student?.birthPlace ?? ""} />
          </label>
          <label>
            Sexe
            <select name="sex" defaultValue={student?.sex ?? ""}>
              <option value="">— Sélectionner —</option>
              <option value="M">Garçon</option>
              <option value="F">Fille</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: 18 }}>
          <PhotoInput
            currentUrl={student?.photoUrl}
            fallbackUrl={student ? defaultAvatarUrl(student.sex, student.id) : null}
          />
          {student?.photoUrl && (
            <label style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
              <input type="checkbox" name="removePhoto" style={{ width: "auto" }} />
              Supprimer la photo actuelle
            </label>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>Coordonnées</h3>
        <div className="form-grid">
          <label>
            Adresse
            <input name="address" maxLength={255} placeholder="Lot II …" defaultValue={student?.address ?? ""} />
          </label>
          <label>
            Téléphone de l&apos;élève
            <input name="phone" maxLength={40} placeholder="+261 34 …" defaultValue={student?.phone ?? ""} />
          </label>
          <label>
            Nom du parent ou tuteur
            <input name="parentName" maxLength={120} defaultValue={student?.parentName ?? ""} />
          </label>
          <label>
            Téléphone du parent
            <input name="parentPhone" maxLength={40} placeholder="+261 32 …" defaultValue={student?.parentPhone ?? ""} />
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Scolarité</h3>
        <div className="form-grid">
          <label>
            Classe et année scolaire *
            <select name="classeId" required defaultValue={student?.classeId ?? ""}>
              <option value="">— Choisir une classe —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.year})
                </option>
              ))}
            </select>
          </label>
          <label>
            Date d&apos;inscription
            <input
              name="registeredAt"
              type="date"
              defaultValue={toDateInput(student?.registeredAt ?? new Date())}
            />
          </label>
          <label>
            Adresse e-mail de connexion {student ? "" : "(facultatif)"}
            <input
              name="email"
              type="email"
              placeholder={student ? undefined : "générée automatiquement si vide"}
              defaultValue={student?.email}
            />
          </label>
        </div>
        {!student && (
          <p className="muted" style={{ marginTop: 12 }}>
            Le matricule est attribué automatiquement à l&apos;enregistrement. Le mot de passe initial est défini par
            l&apos;établissement (voir « Mots de passe par défaut »).
          </p>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-success">
          {submitLabel}
        </button>
        <Link href={cancelHref} className="btn-secondary btn">
          Annuler
        </Link>
      </div>
    </form>
  );
}
