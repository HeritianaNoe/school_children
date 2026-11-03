import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ maxWidth: 460, textAlign: "center" }}>
        <h1>Page introuvable</h1>
        <p className="muted" style={{ margin: "8px 0 16px" }}>
          La page demandée n&apos;existe pas ou l&apos;élément a été supprimé.
        </p>
        <Link href="/dashboard" className="btn">
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
