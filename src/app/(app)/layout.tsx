import { Suspense } from "react";
import Nav from "@/components/Nav";
import TopBar from "@/components/TopBar";
import FlashToast from "@/components/FlashToast";
import AlertsBell from "@/components/AlertsBell";
import { requireUser, loadAccount } from "@/lib/session";
import { ROLES, hasRole } from "@/lib/permissions";
import { getRoleAccessMap } from "@/lib/settings";
import { userImageUrl } from "@/lib/avatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await loadAccount(user.id); // déjà en cache (requireUser) : aucune requête de plus
  const student = user.role === "STUDENT" ? profile?.student ?? null : null;
  const avatarUrl = profile ? userImageUrl(profile) : null;
  const accessMap = await getRoleAccessMap();

  return (
    <div className="app-shell">
      <Nav user={user} studentId={student?.id} avatarUrl={avatarUrl} accessMap={accessMap} />
      <div className="main-area">
        <TopBar>
          {hasRole(user.role, ROLES.STAFF) && (
            <Suspense fallback={null}>
              <AlertsBell canConfigure={hasRole(user.role, ROLES.STAFF)} />
            </Suspense>
          )}
        </TopBar>
        <main className="content">{children}</main>
      </div>
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </div>
  );
}
