import AppearancePicker from "@/components/AppearancePicker";
import { requireUser } from "@/lib/session";

export default async function AppearancePage() {
  await requireUser();
  return (
    <section className="settings-section">
      <h2 style={{ marginTop: 0 }}>Apparence</h2>
      <p className="muted settings-lead">
        Choisissez les couleurs du menu et des boutons. Le choix s&apos;applique immédiatement et reste mémorisé sur cet
        appareil.
      </p>
      <AppearancePicker />
    </section>
  );
}
