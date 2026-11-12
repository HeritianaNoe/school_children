import SettingsTabs from "@/components/SettingsTabs";
import { requireUser } from "@/lib/session";
import { ROLES, hasRole } from "@/lib/permissions";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Paramètres</h1>
          <p>Personnalisez l&apos;application et réglez le fonctionnement de l&apos;établissement</p>
        </div>
      </div>
      <SettingsTabs staff={hasRole(u.role, ROLES.STAFF)} />
      {children}
    </>
  );
}
