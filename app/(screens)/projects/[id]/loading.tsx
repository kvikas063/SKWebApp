import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading boundary for the project detail route.
 *
 * Stops each project card on the grid from prefetching a full project render
 * (project + milestones + tasks + team + reports) as it scrolls into view.
 */
export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading project">
      {/* Header card */}
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-[28rem] max-w-full rounded-lg" />

        {/* Overview: summary charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-xl border bg-card p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Row placeholders below the fold */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
