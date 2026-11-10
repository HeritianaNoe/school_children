import Link from "next/link";
import TablePdfButton from "./TablePdfButton";

type Props = {
  /** Chemin de la page, ex. « /students » */
  path: string;
  /** Filtres actifs à conserver dans les liens de pagination */
  params?: Record<string, string | undefined>;
  /** Nom du paramètre de page dans l'URL (par défaut « page ») */
  pageParam?: string;
  page: number;
  totalPages: number;
  total: number;
  /** Données complètes (toutes les pages) du PDF ; absent = pas de bouton PDF */
  pdf?: { title: string; subtitle?: string; headers: string[]; rows: string[][]; filename?: string };
};

/** Pied de tableau : bouton PDF en bas à gauche, pagination (10 lignes par page) à droite. */
export default function TableFooter({ path, params = {}, pageParam = "page", page, totalPages, total, pdf }: Props) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set(pageParam, String(p));
    const s = sp.toString();
    return s ? `${path}?${s}` : path;
  };
  const off = { opacity: 0.4, pointerEvents: "none" as const };

  if (!pdf && totalPages <= 1) return null;

  return (
    <div className="table-footer no-print">
      <div className="table-footer-left">{pdf && <TablePdfButton {...pdf} />}</div>
      {totalPages > 1 && (
        <div className="table-footer-pager">
          {page > 1 ? (
            <Link href={href(page - 1)} className="btn-secondary btn btn-sm">
              ← Précédent
            </Link>
          ) : (
            <span className="btn-secondary btn btn-sm" style={off}>
              ← Précédent
            </span>
          )}
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            Page {page} / {totalPages} · {total} ligne{total > 1 ? "s" : ""}
          </span>
          {page < totalPages ? (
            <Link href={href(page + 1)} className="btn-secondary btn btn-sm">
              Suivant →
            </Link>
          ) : (
            <span className="btn-secondary btn btn-sm" style={off}>
              Suivant →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
