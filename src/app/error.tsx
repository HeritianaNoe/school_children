"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ maxWidth: 460, textAlign: "center" }}>
        <h1>Une erreur est survenue</h1>
        <p className="muted" style={{ margin: "8px 0 16px" }}>
          L&apos;opération n&apos;a pas pu être effectuée. Réessayez ; si le problème persiste, contactez l&apos;administrateur.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button type="button" onClick={() => reset()}>
            Réessayer
          </button>
          <Link href="/dashboard" className="btn-secondary btn">
            Tableau de bord
          </Link>
        </div>
      </div>
    </main>
  );
}
