import { TableSkeleton } from "@/components/PageSkeleton";

// Affiché immédiatement à chaque changement de page, le temps que les données arrivent.
export default function Loading() {
  return <TableSkeleton />;
}
