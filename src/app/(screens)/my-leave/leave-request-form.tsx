"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { createLeaveRequest } from "@/lib/actions/leave";
import { useRouter } from "next/navigation";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function LeaveRequestForm({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const start = e.target.value;
    const endInput = formRef.current?.querySelector<HTMLInputElement>('input[name="endDate"]');
    if (endInput) {
      endInput.min = start;
      if (endInput.value && endInput.value < start) endInput.value = start;
    }
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const startInput = formRef.current?.querySelector<HTMLInputElement>('input[name="startDate"]');
    const start = startInput?.value || todayISO();
    if (e.target.value && e.target.value < start) {
      e.target.value = start;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const startDate = form.get("startDate") as string;
    const endDate = form.get("endDate") as string;
    const reason = ((form.get("reason") as string) || "").trim();
    if (endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      setLoading(false);
      return;
    }
    if (reason.length < 3) {
      setError("Please provide a reason (at least 3 characters).");
      setLoading(false);
      return;
    }
    try {
      await createLeaveRequest(employeeId, {
        leaveType: form.get("leaveType") as "CASUAL" | "EARNED" | "SICK",
        startDate,
        endDate,
        dayType: (form.get("dayType") as "FULL" | "HALF") || "FULL",
        reason,
      });
      (e.target as HTMLFormElement).reset();
      const endInput = formRef.current?.querySelector<HTMLInputElement>('input[name="endDate"]');
      if (endInput) endInput.min = todayISO();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Request Leave</CardTitle></CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <select id="leaveType" name="leaveType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="CASUAL">Casual</option>
              <option value="EARNED">Earned</option>
              <option value="SICK">Sick</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dayType">Day Type</Label>
            <select id="dayType" name="dayType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="FULL">Full Day</option>
              <option value="HALF">Half Day</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <DateInput
              id="startDate"
              name="startDate"
              required
              min={todayISO()}
              defaultValue={todayISO()}
              onChange={handleStartDateChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <DateInput
              id="endDate"
              name="endDate"
              required
              min={todayISO()}
              defaultValue={todayISO()}
              onChange={handleEndDateChange}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" required minLength={3} placeholder="Family function, medical, etc." />
          </div>
          {error && (
            <div className="md:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Request"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
