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
          Gestion scolaire
        </div>
        <div className="login-pitch">
          <h2>Toute la vie de l&apos;école, au même endroit.</h2>
          <p>Élèves, notes, présences, annonces et paie des enseignants : un seul espace pour toute l&apos;équipe.</p>
        </div>
        <div className="login-foot">Accès réservé aux membres de l&apos;établissement</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <h1>Connexion</h1>
          <p className="muted">Entrez vos identifiants pour accéder à votre espace.</p>

          {searchParams.error && (
            <p className="error" role="alert">
              Email ou mot de passe incorrect.
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
