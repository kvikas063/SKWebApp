"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { initializeLeaveBalances } from "@/lib/actions/leave";
import { Loader2 } from "lucide-react";

export function LeaveActions() {
  const [loading, setLoading] = useState(false);
  const year = new Date().getFullYear();

  async function handleInit() {
    setLoading(true);
    try {
      const result = await initializeLeaveBalances(year);
      alert(`Initialized ${result.count} leave balances for ${year}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Button
      onClick={handleInit}
      disabled={loading}
      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Initializing...
        </>
      ) : (
        `Init Balances ${year}`
      )}
    </Button>
  );
}
