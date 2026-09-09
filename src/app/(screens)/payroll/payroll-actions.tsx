"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { openPayRun } from "@/lib/actions/payroll";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

export function PayrollActions({ year }: { year: number; month: number }) {
  const [loading, setLoading] = useState(false);
  const [showMonth, setShowMonth] = useState(false);
  const router = useRouter();

  async function handleOpen(targetYear: number, targetMonth: number) {
    setLoading(true);
    try {
      const run = await openPayRun(targetYear, targetMonth);
      router.push(`/payroll/${run.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to open pay run");
      setLoading(false);
    }
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMonth((s) => !s)}
        disabled={loading}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Open Pay Run
      </Button>
      {showMonth && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMonth(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-card p-3 shadow-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select month
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {months.map((m, i) => {
                const month = i + 1;
                return (
                  <button
                    key={month}
                    type="button"
                    disabled={loading}
                    onClick={() => handleOpen(year, month)}
                    className="rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30"
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
