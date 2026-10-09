import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading boundary for the employee detail route.
 *
 * Its main purpose is prefetching: a `<Link>` to `/employees/EMP001` on a list
 * screen stops here instead of rendering the whole detail page, so scrolling a
 * list of employees no longer costs one full server render per visible row.
 */
export default function EmployeeDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading employee">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Profile card */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="relative space-y-4 px-6 pb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>

      {/* Tabs / tab content */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-96 max-w-full rounded-lg" />
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
