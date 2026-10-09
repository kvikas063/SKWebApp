import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { NotificationBell } from "@/components/layout/notification-bell";
import { PageLoadingBar } from "@/components/page-loading-bar";
import { HydrationReporter } from "@/components/hydration-reporter";
import { api } from "@/lib/api";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const token = cookies().get("sk-webapp-token")?.value;

  if (!token) {
    return null;
  }

  const [notifications, me] = await Promise.all([
    api.get("/api/notifications?page=1&limit=20"),
    api.get("/api/auth/me"),
  ]);

  const items = notifications.data ?? [];
  const unread = items.filter((i: any) => !i.readAt).length;

  const plain = items.map((i: any) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    body: i.body,
    href: i.href,
    readAt: i.readAt ?? null,
    createdAt: i.createdAt,
  }));

  const user = me.user;
  const displayName = user?.name ?? "";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.role ?? "EMPLOYEE";

  return (
    <div className="flex h-screen overflow-hidden">
      <PageLoadingBar />
      <HydrationReporter />
      <Sidebar
        userName={displayName}
        userRole={displayRole}
        userEmail={displayEmail}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="relative mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="fixed right-4 top-3 z-40 print:hidden sm:right-6 lg:right-8">
              <NotificationBell initialItems={plain} initialUnread={unread} />
            </div>
            {children}
          </div>
        </div>
        <Footer companyName="HRMS Suite" />
      </main>
    </div>
  );
}