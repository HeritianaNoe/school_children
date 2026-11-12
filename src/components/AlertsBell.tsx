import NotificationBell from "./NotificationBell";
import { getOverCapacityClasses } from "@/lib/capacity";
import { getMaxStudentsPerClass } from "@/lib/settings";
import { getStudentAlerts } from "@/lib/student-alerts";

/** Composant serveur : chargé en parallèle (Suspense) pour ne jamais retarder l'affichage de la page. */
export default async function AlertsBell({ canConfigure }: { canConfigure: boolean }) {
  const [classes, max, students] = await Promise.all([
    getOverCapacityClasses(),
    getMaxStudentsPerClass(),
    getStudentAlerts(),
  ]);
  return (
    <NotificationBell
      classes={classes}
      max={max}
      lowGrades={students.lowGrades}
      absences={students.absences}
      canConfigure={canConfigure}
    />
  );
}
