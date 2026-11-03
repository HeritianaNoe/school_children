import { Suspense } from "react";
import Nav from "@/components/Nav";
import MenuButton from "@/components/MenuButton";
import FlashToast from "@/components/FlashToast";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
  const student =
    user.role === "STUDENT"
      ? await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
      : null;

  return (
    <div className="app-shell">
      <Nav user={user} unread={unread} studentId={student?.id} />
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
