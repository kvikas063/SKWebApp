"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Banknote, CalendarDays, Megaphone, Wallet, BellOff, Sparkles, ArrowRight } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: "PAYSLIP" | "LEAVE" | "ANNOUNCEMENT" | "PAYRUN";
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const TYPE_META: Record<NotificationItem["type"], { icon: typeof Banknote; color: string; ring: string; bg: string }> = {
  PAYSLIP:      { icon: Banknote,    color: "text-indigo-700 dark:text-indigo-300",   ring: "ring-indigo-500/20",  bg: "from-indigo-500/15 to-violet-500/15" },
  LEAVE:        { icon: CalendarDays,color: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500/20", bg: "from-emerald-500/15 to-teal-500/15" },
  ANNOUNCEMENT: { icon: Megaphone,   color: "text-amber-700 dark:text-amber-300",     ring: "ring-amber-500/20",   bg: "from-amber-500/15 to-orange-500/15" },
  PAYRUN:       { icon: Wallet,      color: "text-sky-700 dark:text-sky-300",         ring: "ring-sky-500/20",     bg: "from-sky-500/15 to-blue-500/15" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: NotificationItem[];
  initialUnread: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [mounted, setMounted] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setItems(initialItems);
    setUnread(initialUnread);
  }, [initialItems, initialUnread]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setAnchorRect({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      });
    } else {
      setAnchorRect(null);
    }
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-notification-panel]")) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", () => setOpen(false));
      window.addEventListener("scroll", () => setOpen(false), true);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleMarkRead(id: string, href: string | null) {
    setItems((curr) => curr.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  async function handleMarkAll() {
    setItems((curr) => curr.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    setUnread(0);
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary shadow-md shadow-indigo-500/30 transition-all hover:bg-primary/25 hover:text-primary hover:shadow-lg hover:shadow-indigo-500/40",
          open && "bg-primary/25 text-primary shadow-lg shadow-indigo-500/40"
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white shadow ring-2 ring-background"
            style={{ background: "linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {mounted && open && anchorRect && createPortal(
        <div
          data-notification-panel
          className="fixed z-[1000] w-[360px] origin-top-right overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl shadow-indigo-500/30 ring-1 ring-indigo-500/30 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          style={{ top: anchorRect.top, right: anchorRect.right }}
          role="menu"
        >
          <div className="flex items-center justify-between gap-2 border-b bg-gradient-to-r from-indigo-50 via-violet-50/40 to-pink-50/40 px-4 py-3 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-pink-950/30">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-bold">Notifications</p>
                <p className="text-[10px] text-muted-foreground">
                  {unread > 0 ? `${unread} unread` : "You're all caught up"}
                </p>
              </div>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                style={{ color: "#0f172a" }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors hover:bg-slate-500/10 dark:[color:#f1f5f9]"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">No notifications yet</p>
                <p className="text-xs text-muted-foreground">Payslip, leave, and announcement alerts will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.PAYRUN;
                  const Icon = meta.icon;
                  const isUnread = !n.readAt;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id, n.href)}
                        className={cn(
                          "group/item flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset",
                            meta.bg,
                            meta.ring
                          )}
                        >
                          <Icon className={cn("h-4 w-4", meta.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-xs leading-snug", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>
                              {n.title}
                            </p>
                            {isUnread && (
                              <span
                                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: "#7c3aed" }}
                                aria-label="Unread"
                              />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.body}</p>
                          <p className="mt-1 text-[10px] font-semibold text-muted-foreground/80">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/notifications");
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t bg-slate-100 px-3 py-2.5 text-[11px] font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            >
              View all notifications
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
