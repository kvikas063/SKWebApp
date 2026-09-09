"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Sparkles, Timer } from "lucide-react";
import { punchIn, punchOut } from "@/lib/actions/attendance";
import { cn } from "@/lib/utils";

function formatHMS(ms: number) {
  if (ms < 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function QuickPunch({
  employeeId,
  hasPunchIn,
  hasPunchOut,
  punchInAt,
}: {
  employeeId: string;
  hasPunchIn: boolean;
  hasPunchOut: boolean;
  punchInAt: string | Date | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = punchInAt && hasPunchIn && !hasPunchOut && now
    ? now.getTime() - new Date(punchInAt).getTime()
    : 0;

  const state: "idle" | "working" | "done" =
    hasPunchOut ? "done" : hasPunchIn ? "working" : "idle";

  async function handlePunch(action: "in" | "out") {
    setLoading(true);
    try {
      if (action === "in") await punchIn(employeeId);
      else await punchOut(employeeId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  const headline =
    state === "done"
      ? "All done for today"
      : state === "working"
        ? "Currently working"
        : "Not checked in yet";

  const subline =
    state === "done"
      ? "Have a great evening"
      : state === "working"
        ? `Since ${punchInAt ? new Date(punchInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}`
        : "Tap the button to start your day";

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90",
          state === "working"
            ? "from-emerald-500 via-teal-500 to-cyan-600"
            : state === "done"
              ? "from-indigo-500 via-violet-500 to-purple-600"
              : "from-amber-500 via-orange-500 to-rose-500"
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent)]" />
      <div className="relative p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
              <Sparkles className="h-3 w-3" />
              Quick Punch
            </div>
            <h3 className="mt-1 text-lg font-bold tracking-tight">{headline}</h3>
            <p className="mt-0.5 text-xs text-white/90">{subline}</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            {state === "working" ? <Timer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </div>
        </div>

        {mounted && state === "working" && (
          <div className="mt-4 rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Elapsed</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{formatHMS(elapsedMs)}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {state === "idle" && (
            <Button
              onClick={() => handlePunch("in")}
              disabled={loading}
              className="gap-1.5 bg-white text-amber-700 shadow-sm hover:bg-white/90"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Punching in..." : "Punch In"}
            </Button>
          )}
          {state === "working" && (
            <Button
              onClick={() => handlePunch("out")}
              disabled={loading}
              className="gap-1.5 bg-white text-emerald-700 shadow-sm hover:bg-white/90"
            >
              <LogOut className="h-4 w-4" />
              {loading ? "Punching out..." : "Punch Out"}
            </Button>
          )}
          {state === "done" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5" />
              See you tomorrow
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
