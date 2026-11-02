import Nav from "@/components/Nav";
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
        {/* topbar is rendered inside Nav */}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
