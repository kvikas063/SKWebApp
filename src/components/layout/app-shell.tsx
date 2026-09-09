import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getMyNotifications, getUnreadNotificationCount } from "@/lib/actions/notifications";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  // Always read fresh user data from DB so name/email updates show immediately
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, role: true },
  });

  const displayName = fresh?.name ?? user.name;
  const displayEmail = fresh?.email ?? user.email;
  const displayRole = fresh?.role ?? user.role;

  const company = await prisma.company.findFirst({
    where: user.companyId ? { id: user.companyId } : undefined,
    select: { name: true },
  });
  const companyName = company?.name ?? "HRMS Suite";

  const [items, unread] = await Promise.all([
    getMyNotifications(20),
    getUnreadNotificationCount(),
  ]);

  const plain = items.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    body: i.body,
    href: i.href,
    readAt: i.readAt ? i.readAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
  }));

  const hideBell = false;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={displayName}
        userRole={displayRole}
        userEmail={displayEmail}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="relative mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            {!hideBell && (
              <div className="fixed right-4 top-3 z-40 print:hidden sm:right-6 lg:right-8">
                <NotificationBell initialItems={plain} initialUnread={unread} />
              </div>
            )}
            {children}
          </div>
        </div>
        <Footer companyName={companyName} />
      </main>
    </div>
  );
}
