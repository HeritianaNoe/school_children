import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/labels";
import { updateUser } from "@/app/actions/users";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      student: { select: { id: true, matricule: true } },
      teacher: { select: { id: true } },
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

      <form action={updateUser.bind(null, user.id)} className="form-section" style={{ maxWidth: 520 }}>
        <div className="stack">
          <label>
            Nom complet
            <input name="name" required maxLength={120} defaultValue={user.name} />
          </label>
          <label>
            Adresse e-mail
            <input name="email" type="email" required maxLength={160} defaultValue={user.email} />
          </label>
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
