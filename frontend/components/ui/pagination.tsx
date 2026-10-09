"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  className?: string;
}) {
  if (totalCount === 0) return null;

  function goTo(p: number) {
    onPageChange(Math.min(Math.max(1, p), Math.max(1, totalPages)));
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row", className)}>
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{start}</span>–
        <span className="font-semibold text-foreground">{end}</span> of{" "}
        <span className="font-semibold text-foreground">{totalCount}</span>
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(1)} disabled={page === 1} aria-label="First page">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 7) return true;
              if (p === 1 || p === totalPages) return true;
              if (Math.abs(p - page) <= 1) return true;
              return false;
            })
            .reduce<Array<number | "ellipsis">>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
              acc.push(p);
              return acc;
            }, [])
            .map((item, i) =>
              typeof item === "number" ? (
                <Button
                  key={item}
                  variant={item === page ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-xs font-semibold tabular-nums",
                    item === page && "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                  )}
                  onClick={() => goTo(item)}
                >
                  {item}
                </Button>
              ) : (
                <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
              )
            )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(page + 1)} disabled={page === totalPages} aria-label="Next page">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(totalPages)} disabled={page === totalPages} aria-label="Last page">
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
