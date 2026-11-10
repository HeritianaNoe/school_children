export const PAGE_SIZE = 10;

/** Découpe une liste en pages de 10 lignes. `pageParam` vient de l'URL (?page=2). */
export function paginate<T>(items: T[], pageParam?: string, size: number = PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, parseInt(pageParam ?? "1", 10) || 1), totalPages);
  return { items: items.slice((page - 1) * size, page * size), page, totalPages, total };
}
