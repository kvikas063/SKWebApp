"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarPlus, CheckCircle2, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { createLeaveRequest } from "@/lib/actions/leave";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
export function ApplyLeaveCard({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    setError(null);
    setSuccess(false);
    formRef.current?.reset();
    const endInput = formRef.current?.querySelector<HTMLInputElement>('input[name="endDate"]');
    if (endInput) endInput.min = todayISO();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const startDate = form.get("startDate") as string;
    const endDate = form.get("endDate") as string;
    const reason = ((form.get("reason") as string) || "").trim();

    if (endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }
    if (reason.length < 3) {
      setError("Please provide a reason (at least 3 characters).");
      return;
    }

    setLoading(true);
    try {
      await createLeaveRequest(employeeId, {
        leaveType: form.get("leaveType") as "CASUAL" | "EARNED" | "SICK",
        startDate,
        endDate,
        dayType: (form.get("dayType") as "FULL" | "HALF") || "FULL",
        reason,
      });
      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
    setLoading(false);
  }

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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative block w-full overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5" />
          <div className="relative flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-3 w-3" />
                Quick Action
              </div>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">Apply for Leave</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Submit a new request for review</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit a new leave request for review.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-semibold">Request submitted</p>
            <p className="text-xs text-muted-foreground">Your manager has been notified.</p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-leaveType" className="text-xs font-medium">Leave Type</Label>
                <select
                  id="card-leaveType"
                  name="leaveType"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="CASUAL">Casual</option>
                  <option value="EARNED">Earned</option>
                  <option value="SICK">Sick</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-dayType" className="text-xs font-medium">Day Type</Label>
                <select
                  id="card-dayType"
                  name="dayType"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  defaultValue="FULL"
                >
                  <option value="FULL">Full Day</option>
                  <option value="HALF">Half Day</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-startDate" className="text-xs font-medium">Start Date</Label>
                <DateInput
                  id="card-startDate"
                  name="startDate"
                  defaultValue={todayISO()}
                  min={todayISO()}
                  onChange={handleStartDateChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-endDate" className="text-xs font-medium">End Date</Label>
                <DateInput
                  id="card-endDate"
                  name="endDate"
                  defaultValue={todayISO()}
                  min={todayISO()}
                  onChange={handleEndDateChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-reason" className="text-xs font-medium">Reason</Label>
              <Input id="card-reason" name="reason" placeholder="Family function, medical, etc." required minLength={3} />
            </div>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
