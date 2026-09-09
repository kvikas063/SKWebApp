import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { listAnnouncements } from "@/lib/actions/announcements";
import { Megaphone, Pin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { AnnouncementActions } from "./announcement-actions";

export default async function AnnouncementsPage() {
  const user = await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) return null;
  const items = await listAnnouncements(company.id, { authorId: user.id, take: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Company-wide notices and updates"
        icon={Megaphone}
        actions={<AnnouncementActions mode="new" />}
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Megaphone className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No announcements yet</p>
            <p className="text-sm text-muted-foreground">Share news and updates with your team.</p>
            <AnnouncementActions mode="empty" />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
                        {(a.author?.name || "A").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{a.title}</h3>
                        {a.pinned && (
                          <Badge variant="warning" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {a.audience}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.author?.name || "System"} · {formatDateTime(a.publishedAt)}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {a.body}
                      </p>
                    </div>
                    <AnnouncementActions mode="row" id={a.id} pinned={a.pinned} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
