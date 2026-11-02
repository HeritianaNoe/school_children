// Mandeha ivelan'ny Next : `npm run alerts` (ampiasaina amin'ny crontab VPS)
import { runStudentAlerts, runTeacherAlerts } from "../src/lib/alerts";
(async () => {
  await runStudentAlerts();
  await runTeacherAlerts();
  console.log("Alerts done");
  process.exit(0);
})();
