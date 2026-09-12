"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock,
  Banknote,
  FileText,
  Settings,
  ScrollText,
  LogOut,
  Sparkles,
  ChevronRight,
  UserCircle,
  Moon,
  Sun,
  Megaphone,
  Network,
  Mail,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserRole } from "@prisma/client";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/org-chart", label: "Org Chart", icon: Network },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/leave", label: "Leave", icon: CalendarDays },
  { href: "/payroll", label: "Payroll", icon: Banknote },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/email-logs", label: "Email Log", icon: Mail },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const managerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/org-chart", label: "Org Chart", icon: Network },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/leave", label: "Leave", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
];

const employeeNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/org-chart", label: "Org Chart", icon: Network },
  { href: "/my-attendance", label: "My Attendance", icon: Clock },
  { href: "/my-leave", label: "My Leave", icon: CalendarDays },
  { href: "/my-documents", label: "My Documents", icon: File },
  { href: "/my-payslips", label: "My Payslips", icon: Banknote },
  { href: "/holidays", label: "Holiday Calendar", icon: CalendarDays },
];

type SidebarProps = {
  userName: string;
  userRole: UserRole;
  userEmail?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({ userName, userRole, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const nav =
    userRole === "ADMIN"
      ? adminNav
      : userRole === "MANAGER"
        ? managerNav
        : employeeNav;
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)]" style={{ borderColor: "var(--sidebar-border)" }}>
      <Link
        href="/dashboard"
        className="relative flex h-24 items-center gap-3 overflow-hidden border-b bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-5 text-white"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
          <Sparkles className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <div className="relative flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white">HRMS Suite</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">
            {userRole === "ADMIN" ? "HR Admin" : userRole === "MANAGER" ? "Manager Portal" : "Employee Portal"}
          </span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
          Navigation
        </p>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-all duration-200 ease-out",
                active
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/15 text-[var(--sidebar-strong)] font-bold shadow-sm ring-1 ring-inset ring-indigo-500/20"
                  : "font-medium text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-strong)] hover:-translate-x-0.5"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-600 shadow-sm" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-indigo-600 dark:text-indigo-300" : "text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-fg)]"
                )}
                strokeWidth={active ? 3 : 2}
              />
              <span className="flex-1 tracking-tight">{item.label}</span>
              {active && <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-300" strokeWidth={3} />}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t p-3" style={{ borderColor: "var(--sidebar-border)" }} ref={ref}>
        {open && (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 z-50 mb-2 origin-bottom overflow-hidden rounded-lg border shadow-2xl backdrop-blur animate-sidebar-menu"
            style={{
              background: "var(--sidebar-menu-bg)",
              borderColor: "var(--sidebar-border)",
            }}
          >
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              role="menuitem"
              style={{ animationDelay: "40ms" }}
              className="group/item flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--sidebar-fg)] transition-colors hover:bg-[var(--sidebar-menu-hover)] hover:text-[var(--sidebar-strong)] animate-sidebar-item"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-500 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:bg-indigo-500/20 dark:text-indigo-300">
                <UserCircle className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 font-medium">My Profile</span>
            </Link>

            <div className="mx-2 h-px" style={{ background: "var(--sidebar-divider)" }} />

            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              role="menuitem"
              style={{ animationDelay: "90ms" }}
              className="group/item flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--sidebar-fg)] transition-colors hover:bg-[var(--sidebar-menu-hover)] hover:text-[var(--sidebar-strong)] animate-sidebar-item"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-600 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:bg-sky-500/25 dark:text-sky-300">
                {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </div>
              <span className="flex-1 font-medium">Switch Theme</span>
              <span
                role="switch"
                aria-checked={!!isDark}
                className={cn(
                  "relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors",
                  isDark ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-slate-700 shadow transition-transform duration-200",
                    isDark ? "translate-x-[16px]" : "translate-x-0.5"
                  )}
                >
                  {isDark ? (
                    <Moon className="h-2 w-2 text-indigo-600" />
                  ) : (
                    <Sun className="h-2 w-2 text-sky-600" />
                  )}
                </span>
              </span>
            </button>

            <div className="mx-2 h-px" style={{ background: "var(--sidebar-divider)" }} />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              role="menuitem"
              style={{ animationDelay: "140ms" }}
              className="group/item flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400 animate-sidebar-item"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 text-red-600 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:bg-red-500/25 dark:text-red-400">
                <LogOut className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 font-medium">Sign out</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition-all duration-200",
            "bg-[var(--sidebar-hover)]",
            open ? "ring-1 ring-indigo-500/30" : "hover:ring-1 hover:ring-[var(--sidebar-border)]"
          )}
        >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--sidebar-strong)]">{userName}</p>
              <p className="truncate text-xs text-[var(--sidebar-muted)]">
                {userEmail ?? userRole.toLowerCase()}
              </p>
            </div>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-[var(--sidebar-muted)] transition-transform duration-200",
                open && "rotate-90"
              )}
            />
          </button>
      </div>
    </aside>
  );
}
