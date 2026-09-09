import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartyPopper } from "lucide-react";

export function HolidaysWidget({ holidays }: { holidays: { id: string; date: Date; name: string }[] }) {
  const now = new Date();
  const upcoming = holidays
    .filter((h) => new Date(h.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  if (upcoming.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-pink-500" />
          Upcoming Holidays
        </CardTitle>
        <CardDescription>Next {upcoming.length} scheduled holidays</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {upcoming.map((h) => {
            const d = new Date(h.date);
            const month = d.toLocaleString("en-IN", { month: "short" });
            const day = d.getDate();
            const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <li key={h.id} className="flex items-center gap-3 p-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/40">
                  <span className="text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">{month}</span>
                  <span className="text-base font-bold leading-tight text-rose-700 dark:text-rose-300">{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `in ${daysUntil}d`}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
