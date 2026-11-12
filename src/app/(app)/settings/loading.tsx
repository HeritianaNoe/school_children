import { Header } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <div role="status" aria-busy="true">
      <Header />
      <div className="theme-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="skeleton" style={{ height: 150, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
