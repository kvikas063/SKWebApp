import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/lib/rbac";
import { Bell } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMyAllNotifications, getUnreadNotificationCount } from "@/lib/actions/notifications";
import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
  await requireAuth();
  const [items, unread] = await Promise.all([
    getMyAllNotifications(),
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

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>
      <PageHeader
        title="All Notifications"
        description={`You have ${unread} unread notification${unread === 1 ? "" : "s"}`}
        icon={Bell}
      />
      <NotificationsList initialItems={plain} initialUnread={unread} />
    </div>
  );
}
