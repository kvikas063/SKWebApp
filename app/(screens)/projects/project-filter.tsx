"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

const filters = [
  { label: "All", value: "" },
  { label: "Planning", value: "PLANNING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function ProjectFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const current = searchParams.get("status") || "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      {filters.map((f) => {
        const active = current === f.value;
        return (
          <Link
            key={f.value}
            href={f.value ? `${pathname}?status=${f.value}` : pathname}
            className={cn(
              "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}