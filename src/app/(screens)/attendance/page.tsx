import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getAttendanceForMonth } from "@/lib/actions/attendance";
import { requireAuth } from "@/lib/rbac";
import { AttendanceActions } from "./attendance-actions";
import { AttendanceTable } from "./attendance-table";
import { Calendar, Clock, UserCheck, UserX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function AttendancePage() {
  const user = await requireAuth();
  const now = new Date();
  
  let employeeIds: string[] | undefined;
  if (user.role === UserRole.MANAGER) {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (me) {
      const reports = await prisma.employee.findMany({
        where: { managerId: me.id, isActive: true },
        select: { id: true },
      });
      employeeIds = reports.map((r) => r.id);
    }
  }
  
  const records = await getAttendanceForMonth(now.getFullYear(), now.getMonth() + 1, undefined, employeeIds);

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT" || r.status === "LOP").length;
  const halfDayCount = records.filter((r) => r.status === "HALF_DAY").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={now.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        icon={Calendar}
        actions={<AttendanceActions year={now.getFullYear()} month={now.getMonth() + 1} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Records"
          value={records.length}
          icon={<Calendar className="h-5 w-5" />}
          accent="from-indigo-500 to-violet-500"
        />
        <StatCard
          title="Present"
          value={presentCount}
          icon={<UserCheck className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Absent / LOP"
          value={absentCount}
          icon={<UserX className="h-5 w-5" />}
          accent="from-rose-500 to-pink-500"
        />
        <StatCard
          title="Half Days"
          value={halfDayCount}
          icon={<Clock className="h-5 w-5" />}
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AttendanceTable records={records} />
        </CardContent>
      </Card>
    </div>
  );
}
