import NotificationBell from "./NotificationBell";
import { getOverCapacityClasses } from "@/lib/capacity";
import { getMaxStudentsPerClass } from "@/lib/settings";

/** Composant serveur : chargé en parallèle (Suspense) pour ne jamais retarder l'affichage de la page. */
export default async function CapacityBell({ canConfigure }: { canConfigure: boolean }) {
  const [classes, max] = await Promise.all([
    getOverCapacityClasses(), 
    getMaxStudentsPerClass()
  ]);
  
  return (
    <NotificationBell 
      classes={classes} 
      max={max} 
      lowGrades={[]} 
      absences={[]} 
      canConfigure={canConfigure} 
    />
  );
}