import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAuth } from "@/lib/rbac";
import { getHolidays } from "@/lib/actions/leave";
import { CalendarDays, Sun, Sparkles } from "lucide-react";
import * as React from "react";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function getDayName(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long" });
}

function daysUntil(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 30) return `In ${diff} days`;
  if (diff < 365) {
    const months = Math.floor(diff / 30);
    const remDays = diff % 30;
    const monthLabel = months === 1 ? "month" : "months";
    if (remDays === 0) return `In ${months} ${monthLabel}`;
    return `In ${months} ${monthLabel} ${remDays} ${remDays === 1 ? "day" : "days"}`;
  }
  const years = Math.floor(diff / 365);
  const remMonths = Math.floor((diff % 365) / 30);
  const yearLabel = years === 1 ? "year" : "years";
  if (remMonths === 0) return `In ${years} ${yearLabel}`;
  return `In ${years} ${yearLabel} ${remMonths} ${remMonths === 1 ? "month" : "months"}`;
}

export default async function HolidaysPage() {
  await requireAuth();
  const allHolidays = await getHolidays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const holidays = allHolidays.filter((h) => new Date(h.date).getFullYear() === year);

  const upcoming = holidays.filter((h) => new Date(h.date) >= today);
  const next = upcoming[0];
  const totalThisYear = holidays.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendar"
        description={`Upcoming company holidays for ${year}`}
        icon={CalendarDays}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Holidays"
          value={holidays.length}
          icon={<CalendarDays className="h-5 w-5" />}
          accent="from-indigo-500 to-violet-500"
        />
        <StatCard
          title="This Year"
          value={totalThisYear}
          icon={<Sun className="h-5 w-5" />}
          accent="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Next Holiday"
          value={next ? next.name : "—"}
          description={next ? `${formatDate(next.date)} · ${daysUntil(next.date)}` : "No upcoming holidays"}
          icon={<Sparkles className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
        />
      </div>

      {next && (
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Up Next
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{next.name}</h2>
            <p className="mt-1 text-sm text-white/90">{formatDate(next.date)} · {getDayName(next.date)}</p>
            <p className="mt-1 text-xs font-semibold text-white/80">{daysUntil(next.date)}</p>
          </div>
        </Card>
      )}

      {holidays.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No holidays published yet</p>
            <p className="text-sm text-muted-foreground">Your admin will publish the holiday calendar here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const rows: React.ReactNode[] = [];
                let insertedUpcoming = false;
                let upcomingCount = 0;
                for (const h of holidays) {
                  const isPast = new Date(h.date) < today;
                  if (!isPast && !insertedUpcoming) {
                    rows.push(
                      <div key="upcoming-divider" className="flex items-center justify-center gap-3 bg-muted/40 px-3 py-3">
                        <div className="h-px flex-1 bg-border" />
                        <span
                          className="upcoming-label inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Upcoming
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    );
                    insertedUpcoming = true;
                  }
                  if (!isPast) upcomingCount += 1;
                  const days = daysUntil(h.date);
                  const date = new Date(h.date);
                  const day = date.getDate();
                  const monthShort = date.toLocaleDateString("en-IN", { month: "short" });
                  const weekday = date.toLocaleDateString("en-IN", { weekday: "long" });
                  rows.push(
                    <div
                      key={h.id}
                      className="flex items-center gap-4 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border bg-card shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{monthShort}</span>
                        <span className="text-xl font-bold leading-none text-foreground">{day}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{h.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{weekday} · {formatDate(h.date)}</p>
                      </div>
                      {days && (
                        <div className="hidden text-right sm:block">
                          <p className="text-xs font-semibold text-muted-foreground">{days}</p>
                        </div>
                      )}
                    </div>
                  );
                }
                if (insertedUpcoming && upcomingCount === 0) {
                  rows.push(
                    <div key="no-upcoming" className="flex flex-col items-center justify-center gap-1 p-8 text-center">
                      <p className="text-sm font-semibold text-foreground">No upcoming holidays</p>
                      <p className="text-xs text-muted-foreground">You&apos;ve seen all holidays for this year.</p>
                    </div>
                  );
                }
                return rows;
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
