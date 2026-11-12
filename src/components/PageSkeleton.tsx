/** Squelettes affichés pendant le chargement d'une page (voir les fichiers loading.tsx). */
export function Header() {
  return (
    <div className="page-header" aria-hidden="true">
      <div style={{ width: "100%" }}>
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-text" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only" style={{ position: "absolute", left: -9999 }}>
        Chargement…
      </span>
      <Header />
      <div className="skeleton-box">
        {Array.from({ length: rows }).map((_, i) => (
          <span key={i} className="skeleton skeleton-row" style={{ opacity: 1 - i * 0.07 }} />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only" style={{ position: "absolute", left: -9999 }}>
        Chargement…
      </span>
      <Header />
      <div className="grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="skeleton skeleton-stat" />
        ))}
      </div>
      <div className="skeleton-box" style={{ marginTop: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    </div>
  );
}
