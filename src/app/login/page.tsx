import { login } from "@/app/actions/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "linear-gradient(145deg, #0f172a 0%, #1e3a5f 100%)",
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 400, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,.25)" }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏫</div>
          <h1 style={{ marginBottom: 4 }}>Connexion</h1>
          <p className="muted">Gestion scolaire</p>
        </div>

        {searchParams.error && (
          <p className="error" style={{ textAlign: "center" }}>
            Email ou mot de passe incorrect.
          </p>
        )}

        <form action={login} className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label>
            Adresse e-mail
            <input name="email" type="email" required autoComplete="username" placeholder="ex: admin@ecole.mg" />
          </label>
          <label>
            Mot de passe
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit" style={{ marginTop: 8, width: "100%" }}>
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
