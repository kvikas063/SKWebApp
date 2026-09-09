"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { closeMonth } from "@/lib/actions/attendance";

export function AttendanceActions({ year, month }: { year: number; month: number }) {
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    if (!confirm(`Close attendance for ${month}/${year}? This will mark missing days as LOP.`)) return;
    setLoading(true);
    try {
      const result = await closeMonth(year, month);
      alert(`Month closed. ${result.lopCreated} LOP records created.`);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Button
      onClick={handleClose}
      disabled={loading}
      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Closing...
        </>
      ) : (
        "Close Month"
      )}
    </Button>
  );
}
