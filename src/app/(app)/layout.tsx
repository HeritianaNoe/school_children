import { Suspense } from "react";
import Nav from "@/components/Nav";
import MenuButton from "@/components/MenuButton";
import FlashToast from "@/components/FlashToast";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { userImageUrl } from "@/lib/avatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const student =
    user.role === "STUDENT"
      ? await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
      : null;
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, photoUrl: true, sex: true, student: { select: { sex: true, photoUrl: true } } },
  });
  const avatarUrl = profile ? userImageUrl(profile) : null;

  return (
    <div className="app-shell">
      <Nav user={user} studentId={student?.id} avatarUrl={avatarUrl} />
      <div className="main-area">
        <main className="content">
          <MenuButton />
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </div>
  );
}
