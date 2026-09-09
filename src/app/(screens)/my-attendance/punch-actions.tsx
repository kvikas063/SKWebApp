"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { punchIn, punchOut } from "@/lib/actions/attendance";
import { useRouter } from "next/navigation";

export function PunchActions({
  employeeId,
  hasPunchIn,
  hasPunchOut,
}: {
  employeeId: string;
  hasPunchIn: boolean;
  hasPunchOut: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePunchIn() {
    setLoading(true);
    try {
      await punchIn(employeeId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  async function handlePunchOut() {
    setLoading(true);
    try {
      await punchOut(employeeId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      {!hasPunchIn && (
        <Button onClick={handlePunchIn} disabled={loading}>Punch In</Button>
      )}
      {hasPunchIn && !hasPunchOut && (
        <Button onClick={handlePunchOut} disabled={loading} variant="outline">Punch Out</Button>
      )}
      {hasPunchOut && <p className="text-sm text-muted-foreground">You&apos;ve completed today&apos;s attendance.</p>}
    </div>
  );
}
