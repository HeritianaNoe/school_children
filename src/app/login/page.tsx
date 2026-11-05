import { login } from "@/app/actions/auth";
import Icon from "@/components/Icons";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="login-shell">
      <section className="login-brand" aria-hidden="true">
        <div className="login-logo">
          <span className="brand-mark">
            <Icon name="school" size={22} />
          </span>
          École lumière
        </div>
        <div className="login-pitch">
          <h2>Toute la vie de l&apos;école, au même endroit.</h2>
          <p>La vie est une école permanente, peu importe où tu vas.</p>
        </div>
        <div className="login-foot">Accès réservé aux membres de l&apos;établissement</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-school" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span className="brand-mark">
              <Icon name="school" size={22} />
            </span>
            <strong style={{ fontSize: "1.15rem" }}>École lumière</strong>
          </div>
          <h1>Connexion</h1>
          <p className="muted">Entrez vos identifiants pour accéder à votre espace.</p>

          {searchParams.error && (
            <p className="error" role="alert">
              {searchParams.error === "session"
                ? "Votre session a expiré ou le compte n'existe plus. Veuillez vous reconnecter."
                : "Email ou mot de passe incorrect."}
            </p>
          )}

          <form action={login} className="form-grid">
            <label>
              Adresse e-mail
              <input name="email" type="email" required autoComplete="username" placeholder="prenom.nom@ecole.mg" />
            </label>
            <label>
              Mot de passe
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <button type="submit" style={{ width: "100%", marginTop: 4 }}>
              Se connecter
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
