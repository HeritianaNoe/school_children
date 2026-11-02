import { login } from "@/app/actions/auth";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main style={{ maxWidth: 380 }}>
      <h1>Hiditra</h1>
      {searchParams.error && <p style={{ color: "#dc2626" }}>Email na teny miafina diso.</p>}
      <form action={login} className="stack">
        <label>Email<input name="email" type="email" required /></label>
        <label>Teny miafina<input name="password" type="password" required /></label>
        <button>Hiditra</button>
      </form>
    </main>
  );
}
