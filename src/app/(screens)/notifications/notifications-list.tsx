"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CalendarDays,
  Megaphone,
  Wallet,
  BellOff,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

type PlainNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type FilterKey = "all" | "unread" | "payslip" | "leave" | "announcement" | "payrun";

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; color: string; ring: string; label: string }> = {
  PAYSLIP: { icon: Banknote, bg: "from-emerald-500/15 to-teal-500/15", color: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30", label: "Payslip" },
  LEAVE: { icon: CalendarDays, bg: "from-amber-500/15 to-orange-500/15", color: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/30", label: "Leave" },
  ANNOUNCEMENT: { icon: Megaphone, bg: "from-pink-500/15 to-rose-500/15", color: "text-pink-600 dark:text-pink-400", ring: "ring-pink-500/30", label: "Announcement" },
  PAYRUN: { icon: Wallet, bg: "from-indigo-500/15 to-violet-500/15", color: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500/30", label: "Pay Run" },
};

function timeAgo(iso: string) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "payslip", label: "Payslips" },
  { key: "leave", label: "Leave" },
  { key: "announcement", label: "Announcements" },
  { key: "payrun", label: "Pay Runs" },
];

export function NotificationsList({
  initialItems,
  initialUnread,
}: {
  initialItems: PlainNotification[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((n) => !n.readAt);
    if (filter === "payslip") return items.filter((n) => n.type === "PAYSLIP");
    if (filter === "leave") return items.filter((n) => n.type === "LEAVE");
    if (filter === "announcement") return items.filter((n) => n.type === "ANNOUNCEMENT");
    if (filter === "payrun") return items.filter((n) => n.type === "PAYRUN");
    return items;
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((n) => !n.readAt).length,
      payslip: items.filter((n) => n.type === "PAYSLIP").length,
      leave: items.filter((n) => n.type === "LEAVE").length,
      announcement: items.filter((n) => n.type === "ANNOUNCEMENT").length,
      payrun: items.filter((n) => n.type === "PAYRUN").length,
    }),
    [items]
  );

  async function handleMarkRead(id: string, href: string | null) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    startTransition(async () => {
      await markNotificationRead(id);
    });
    if (href) router.push(href);
  }

  async function handleMarkAll() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-card p-1 shadow-sm">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
        {initialUnread > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            {filter === "unread" ? <BellOff className="h-6 w-6 text-muted-foreground" /> : <Inbox className="h-6 w-6 text-muted-foreground" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {filter === "unread" ? "No unread notifications" : filter === "all" ? "No notifications yet" : "Nothing here"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {filter === "unread"
                ? "You're all caught up. New alerts will appear here."
                : "Payslip, leave, and announcement alerts will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <ul className="divide-y divide-border">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.PAYRUN;
              const Icon = meta.icon;
              const isUnread = !n.readAt;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id, n.href)}
                    className={cn(
                      "group/item flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/60"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset",
                        meta.bg,
                        meta.ring
                      )}
                    >
                      <Icon className={cn("h-5 w-5", meta.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "text-sm",
                                isUnread ? "font-bold text-foreground" : "font-medium text-foreground/90"
                              )}
                            >
                              {n.title}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                        </div>
                        {isUnread && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500"
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {filtered.length} notification{filtered.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
