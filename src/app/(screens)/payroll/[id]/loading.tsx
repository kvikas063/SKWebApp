import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading boundary for the pay-run detail route.
 *
 * Also stops `<Link>` prefetch on the payroll list from fully rendering a run
 * (which loads every payslip) for each visible row.
 */
export default function PayRunDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading pay run">
      {/* Back link */}
      <Skeleton className="h-4 w-32" />

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>

      {/* Earnings / deductions breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border bg-card p-6">
            <Skeleton className="h-5 w-44" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Payslips table */}
      <div className="space-y-4 rounded-xl border bg-card">
        <div className="border-b p-6">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="space-y-3 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
