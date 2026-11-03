import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/labels";
import { changePassword } from "@/app/actions/account";

export default async function AccountPage() {
  const u = await requireUser();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mon compte</h1>
          <p>
            {u.name} · {ROLE_LABEL[u.role] ?? u.role}
          </p>
        </div>
      </div>

      <form action={changePassword} className="form-section" style={{ maxWidth: 460 }}>
        <h3>Changer mon mot de passe</h3>
        <div className="stack">
          <label>
            Mot de passe actuel
            <input name="current" type="password" required autoComplete="current-password" />
          </label>
          <label>
            Nouveau mot de passe (8 caractères minimum)
            <input name="next" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <label>
            Confirmer le nouveau mot de passe
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">Modifier le mot de passe</button>
        </div>
      </form>
    </>
  );
}
