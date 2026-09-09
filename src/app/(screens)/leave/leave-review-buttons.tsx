"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewLeaveRequest } from "@/lib/actions/leave";
import { useRouter } from "next/navigation";

export function LeaveReviewButtons({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle(decision: "APPROVED" | "REJECTED") {
    setLoading(true);
    try {
      await reviewLeaveRequest(requestId, decision);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handle("APPROVED")}
        disabled={loading}
        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm hover:from-emerald-600 hover:to-green-700"
      >
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        onClick={() => handle("REJECTED")}
        disabled={loading}
        className="bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm hover:from-rose-600 hover:to-red-700"
      >
        <XCircle className="mr-1.5 h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}
