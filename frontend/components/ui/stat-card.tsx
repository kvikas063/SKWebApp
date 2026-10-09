import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
  accent?: string;
  href?: string;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
  accent = "from-blue-500 to-indigo-500",
  href,
}: StatCardProps) {
  const isLink = !!href;
  const Inner = (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {icon && (
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                accent
              )}
            >
              {icon}
            </div>
          )}
          {isLink && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
              View
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          )}
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 font-bold shadow-sm"
              style={
                trend.positive
                  ? { backgroundColor: "#10b981", color: "#ffffff" }
                  : { backgroundColor: "#f43f5e", color: "#ffffff" }
              }
            >
              {trend.positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </>
  );

  const baseClass = cn(
    "group relative block overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700",
    className
  );

  if (isLink) {
    return (
      <Link href={href!} className={baseClass}>
        {Inner}
      </Link>
    );
  }
  return <div className={baseClass}>{Inner}</div>;
}