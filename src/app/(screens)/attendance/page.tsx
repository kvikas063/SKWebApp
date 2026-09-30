import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getAttendancePage } from "@/lib/actions/attendance";
import { requireAuth } from "@/lib/rbac";
import { AttendanceActions } from "./attendance-actions";
import { AttendanceTable } from "./attendance-table";
import { Calendar, Clock, UserCheck, UserX } from "lucide-react";

type SearchParams = Promise<{ page?: string; status?: string }>;

export default async function AttendancePage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuth();
  const now = new Date();
  const params = await searchParams;

  const { data: records, page, limit, total, totalPages, summary, statusCounts } =
    await getAttendancePage({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      page: params.page,
      status: params.status,
    });

  const isFiltered = !!params.status && params.status !== "ALL";

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
          value={summary.totalRecords}
          icon={<Calendar className="h-5 w-5" />}
          accent="from-indigo-500 to-violet-500"
        />
        <StatCard
          title="Present"
          value={summary.present}
          icon={<UserCheck className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Absent / LOP"
          value={summary.absent}
          icon={<UserX className="h-5 w-5" />}
          accent="from-rose-500 to-pink-500"
        />
        <StatCard
          title="Half Days"
          value={summary.halfDay}
          icon={<Clock className="h-5 w-5" />}
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AttendanceTable
            records={records}
            total={total}
            page={page}
            pageSize={limit}
            totalPages={totalPages}
            statusCounts={statusCounts}
            isFiltered={isFiltered}
          />
        </CardContent>
      </Card>
    </div>
  );
}
