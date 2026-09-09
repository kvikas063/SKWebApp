import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { getMonthName } from "@/lib/utils";
import { Banknote, Wallet, TrendingUp, Receipt } from "lucide-react";
import { PayslipList } from "./payslip-list";

export default async function MyPayslipsPage() {
  const user = await requireAuth();
  if (!user.employeeId) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Payslips" icon={Banknote} />
        <div className="rounded-lg border bg-card p-16 text-center text-muted-foreground">
          No employee profile linked to your account.
        </div>
      </div>
    );
  }

  const payslips = await prisma.paySlip.findMany({
    where: { employeeId: user.employeeId },
    include: { payRun: { select: { id: true, year: true, month: true, status: true } } },
    orderBy: [{ payRun: { year: "desc" } }, { payRun: { month: "desc" } }],
  });

  const finalized = payslips.filter((p) => p.payRun.status === "FINALIZED");
  const totalEarned = finalized.reduce((s, p) => s + p.netPaise, 0);
  const latest = finalized[0];

  const plain = finalized.map((s) => ({
    id: s.id,
    paidDays: s.paidDays,
    lopDays: s.lopDays,
    grossPaise: s.grossPaise,
    totalDeductionsPaise: s.totalDeductionsPaise,
    netPaise: s.netPaise,
    payRun: {
      id: s.payRun.id,
      year: s.payRun.year,
      month: s.payRun.month,
      status: s.payRun.status,
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payslips"
        description={`${finalized.length} finalized payslip${finalized.length === 1 ? "" : "s"} available`}
        icon={Banknote}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Earned"
          value={formatINR(totalEarned)}
          icon={<Wallet className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Latest Net"
          value={latest ? formatINR(latest.netPaise) : "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          description={latest ? `${getMonthName(latest.payRun.month)} ${latest.payRun.year}` : "No payslips yet"}
          accent="from-indigo-500 to-violet-500"
        />
        <StatCard
          title="Payslips"
          value={finalized.length}
          icon={<Receipt className="h-5 w-5" />}
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <PayslipList slips={plain} />
    </div>
  );
}
