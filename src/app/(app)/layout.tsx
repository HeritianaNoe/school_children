import { Suspense } from "react";
import Nav from "@/components/Nav";
import TopBar from "@/components/TopBar";
import FlashToast from "@/components/FlashToast";
import { requireUser, loadAccount } from "@/lib/session";
import { userImageUrl } from "@/lib/avatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await loadAccount(user.id); // déjà en cache (requireUser) : aucune requête de plus
  const student = user.role === "STUDENT" ? profile?.student ?? null : null;
  const avatarUrl = profile ? userImageUrl(profile) : null;

  return (
    <div className="app-shell">
      <Nav user={user} studentId={student?.id} avatarUrl={avatarUrl} />
      <div className="main-area">
        <TopBar />
        <main className="content">{children}</main>
      </div>
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </div>
  );
}
