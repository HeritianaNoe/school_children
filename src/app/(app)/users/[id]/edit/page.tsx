import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL, TEACHER_STATUS_LABEL, TEACHER_STATUS_VALUES } from "@/lib/labels";
import { updateUser } from "@/app/actions/users";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import { userImageUrl } from "@/lib/avatar";
import PhotoInput from "@/components/PhotoInput";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      student: { select: { id: true, matricule: true, sex: true, photoUrl: true, phone: true, firstName: true, lastName: true } },
      teacher: { select: { id: true, status: true } },
    },
  });
  if (!user) notFound();

  // Seul ADMIN édite les ADMIN
  if (user.role === "ADMIN" && me.role !== "ADMIN") notFound();

  const roles = Object.entries(ROLE_LABEL).filter(([k]) => {
    if (k === "ADMIN" && me.role !== "ADMIN") return false;
    return true;
  });

  const isSelf = user.id === me.id;
  const linked = !!(user.student || user.teacher);
  const ownPhotoUrl = user.student?.photoUrl ?? user.photoUrl;
  const phone = user.student ? user.student.phone : user.phone;
  // Les comptes non-élèves enregistrent « Nom Prénom » : le premier mot est le nom, le reste le prénom
  const [firstWord, ...restWords] = user.name.trim().split(/\s+/);
  const lastName = user.student ? user.student.lastName : firstWord;
  const firstName = user.student ? user.student.firstName : restWords.join(" ");

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier l&apos;utilisateur</h1>
          <p>
            {user.name} · {ROLE_LABEL[user.role] ?? user.role}
          </p>
        </div>
        <Link href="/users" className="btn-secondary btn">
          ← Retour à la liste
        </Link>
      </div>

      {linked && (
        <div className="card" style={{ marginBottom: 16, background: "var(--warning-soft)", borderColor: "#fcd34d" }}>
          <p style={{ fontSize: "0.9rem" }}>
            Ce compte est lié à{" "}
            {user.student ? (
              <Link href={`/students/${user.student.id}`}>l&apos;élève {user.student.matricule}</Link>
            ) : (
              "un enseignant"
            )}
            . Le rôle ne devrait être modifié qu&apos;avec précaution.
          </p>
        </div>
      )}

      <form action={updateUser.bind(null, user.id)} className="form-section" style={{ maxWidth: 560 }}>
        <div className="stack">
          <label>
            Nom *
            <input name="lastName" required maxLength={80} defaultValue={lastName} />
          </label>
          <label>
            Prénom {user.student ? "*" : ""}
            <input name="firstName" required={!!user.student} maxLength={80} defaultValue={firstName} />
          </label>
          <label>
            Adresse e-mail
            <input name="email" type="email" required maxLength={160} defaultValue={user.email} />
          </label>
          <label>
            Numéro de téléphone
            <input name="phone" type="tel" maxLength={40} placeholder="+261 34 00 000 00" defaultValue={phone ?? ""} />
          </label>
          <div>
            <PhotoInput
              label="Photo de l'utilisateur"
              currentUrl={ownPhotoUrl}
              fallbackUrl={userImageUrl(user)}
            />
            {ownPhotoUrl && (
              <label style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
                <input type="checkbox" name="removePhoto" style={{ width: "auto" }} />
                Supprimer la photo actuelle
              </label>
            )}
          </div>
          {user.teacher && (
            <label>
              Statut de l&apos;enseignant
              <select name="teacherStatus" defaultValue={user.teacher.status}>
                {TEACHER_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {TEACHER_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Rôle
            <select name="role" required defaultValue={user.role} disabled={isSelf}>
              {roles.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            {isSelf && (
              <input type="hidden" name="role" value={user.role} />
            )}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
            <input
              name="active"
              type="checkbox"
              defaultChecked={user.active}
              disabled={isSelf}
            />
            Compte actif
            {isSelf && <input type="hidden" name="active" value="on" />}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
            <input name="resetPassword" type="checkbox" />
            Réinitialiser le mot de passe par défaut
          </label>
        </div>

        <p className="muted" style={{ marginTop: 12, fontSize: "0.88rem" }}>
          Mot de passe par défaut : <code>{DEFAULT_PASSWORDS.STAFF}</code> (personnel) ou{" "}
          <code>{DEFAULT_PASSWORDS.STUDENT}</code> (élève).
        </p>

        <div className="form-actions">
          <button type="submit">Enregistrer</button>
          <Link href="/users" className="btn-secondary btn">
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
