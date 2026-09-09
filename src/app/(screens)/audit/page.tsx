import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { ScrollText, Activity, User, Database } from "lucide-react";
import { AuditLogTable } from "./audit-log-table";

export default async function AuditPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  const todayCount = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const uniqueActors = new Set(logs.map((l) => l.actorId).filter(Boolean)).size;

  const plain = logs.map((l) => ({
    id: l.id,
    createdAt: l.createdAt.toISOString(),
    action: l.action,
    entityType: l.entityType,
    actor: l.actor ? { name: l.actor.name, email: l.actor.email } : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Append-only activity log of system events"
        icon={ScrollText}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Events" value={logs.length} icon={<Database className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
        <StatCard title="Today" value={todayCount} icon={<Activity className="h-5 w-5" />} accent="from-emerald-500 to-teal-500" />
        <StatCard title="Unique Actors" value={uniqueActors} icon={<User className="h-5 w-5" />} accent="from-amber-500 to-orange-500" />
      </div>

      <Card>
        <CardContent className="p-0">
          <AuditLogTable logs={plain} />
        </CardContent>
      </Card>
    </div>
  );
}
