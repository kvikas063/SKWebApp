import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAuth } from "@/lib/rbac";
import { getTodayAttendance } from "@/lib/actions/attendance";
import { PunchActions } from "./punch-actions";
import { Clock, CalendarCheck, Timer, LogIn, LogOut } from "lucide-react";

export default async function MyAttendancePage() {
  const user = await requireAuth();
  if (!user.employeeId) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Attendance" icon={Clock} />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No employee profile linked to your account.
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = await getTodayAttendance(user.employeeId);
  const hasPunchIn = !!today?.punchIn;
  const hasPunchOut = !!today?.punchOut;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        description={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        icon={Clock}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Punch In"
          value={hasPunchIn ? new Date(today!.punchIn!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
          icon={<LogIn className="h-5 w-5" />}
          accent={hasPunchIn ? "from-emerald-500 to-teal-500" : "from-slate-400 to-slate-500"}
        />
        <StatCard
          title="Punch Out"
          value={hasPunchOut ? new Date(today!.punchOut!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
          icon={<LogOut className="h-5 w-5" />}
          accent={hasPunchOut ? "from-rose-500 to-pink-500" : "from-slate-400 to-slate-500"}
        />
        <StatCard
          title="Worked"
          value={today?.workedMinutes ? `${Math.floor(today.workedMinutes / 60)}h ${today.workedMinutes % 60}m` : "—"}
          icon={<Timer className="h-5 w-5" />}
          accent="from-indigo-500 to-violet-500"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {hasPunchIn && hasPunchOut
                  ? "You're all set for today"
                  : hasPunchIn
                  ? "Currently checked in"
                  : "Not yet checked in"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasPunchIn && hasPunchOut
                  ? "Have a great evening!"
                  : "Use the controls below to punch in or out."}
              </p>
            </div>
            <PunchActions
              employeeId={user.employeeId}
              hasPunchIn={hasPunchIn}
              hasPunchOut={hasPunchOut}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
