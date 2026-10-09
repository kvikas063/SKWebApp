"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/utils";
import { Shield } from "lucide-react";

type Log = {
  id: string;
  createdAt: string | Date;
  action: string;
  entityType: string;
  actor: { name: string | null; email: string | null } | null;
};

type ActionStyle = { bg: string; fg: string; ring: string };

const actionColors: Record<string, ActionStyle> = {
  CREATE:     { bg: "#d1fae5", fg: "#065f46", ring: "#10b981" },
  UPDATE:     { bg: "#dbeafe", fg: "#1e3a8a", ring: "#3b82f6" },
  DELETE:     { bg: "#ffe4e6", fg: "#9f1239", ring: "#f43f5e" },
  LOGIN:      { bg: "#ede9fe", fg: "#5b21b6", ring: "#8b5cf6" },
  LOGOUT:     { bg: "#f1f5f9", fg: "#0f172a", ring: "#64748b" },
  APPROVE:    { bg: "#16a34a", fg: "#ffffff", ring: "#15803d" },
  REJECT:     { bg: "#dc2626", fg: "#ffffff", ring: "#b91c1c" },
  REVIEW:     { bg: "#f59e0b", fg: "#ffffff", ring: "#d97706" },
  REVIEWING:  { bg: "#f59e0b", fg: "#ffffff", ring: "#d97706" },
  CANCEL:     { bg: "#7c2d12", fg: "#ffffff", ring: "#9a3412" },
  FINALIZE:   { bg: "#4f46e5", fg: "#ffffff", ring: "#4338ca" },
  LOCK:       { bg: "#7c3aed", fg: "#ffffff", ring: "#6d28d9" },
  SUBMIT:     { bg: "#0284c7", fg: "#ffffff", ring: "#0369a1" },
  PUNCH:      { bg: "#0d9488", fg: "#ffffff", ring: "#0f766e" },
  OPEN:       { bg: "#0891b2", fg: "#ffffff", ring: "#0e7490" },
  CLOSE:      { bg: "#be123c", fg: "#ffffff", ring: "#9f1239" },
  INITIALIZE: { bg: "#a16207", fg: "#ffffff", ring: "#854d0e" },
  CLOSE_MONTH:{ bg: "#be123c", fg: "#ffffff", ring: "#9f1239" },
  PUNCH_IN:   { bg: "#0d9488", fg: "#ffffff", ring: "#0f766e" },
  PUNCH_OUT:  { bg: "#0f766e", fg: "#ffffff", ring: "#115e59" },
  INITIALIZE_BALANCES: { bg: "#a16207", fg: "#ffffff", ring: "#854d0e" },
};

function actionColor(action: string): ActionStyle {
  const upper = action.toUpperCase();
  if (actionColors[upper]) return actionColors[upper];
  const key = upper.split("_")[0];
  return actionColors[key] ?? { bg: "#475569", fg: "#ffffff", ring: "#334155" };
}

function humanizeEntity(entity: string): string {
  if (!entity) return "record";
  return entity
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const actionMessages: Record<string, string> = {
  CREATE: "Created a new {entity}",
  UPDATE: "Updated an existing {entity}",
  DELETE: "Deleted a {entity}",
  LOGIN: "Signed in to the system",
  LOGOUT: "Signed out of the system",
  APPROVE: "Approved a {entity}",
  REJECT: "Rejected a {entity}",
  REVIEW: "Reviewed a {entity}",
  REVIEWING: "Marked a {entity} for review",
  CANCEL: "Cancelled a {entity}",
  FINALIZE: "Finalized a {entity}",
  LOCK: "Locked a {entity}",
  SUBMIT: "Submitted a {entity}",
  PUNCH_IN: "Punched in for the day",
  PUNCH_OUT: "Punched out for the day",
  OPEN: "Opened a {entity}",
  CLOSE: "Closed a {entity}",
  CLOSE_MONTH: "Closed the monthly payroll cycle",
  INITIALIZE_BALANCES: "Initialized leave balances for the year",
  INITIALIZE: "Initialized a {entity}",
  PASSWORD: "Changed account password",
  EXPORT: "Exported {entity} data",
  PRINT: "Printed a {entity}",
  VIEW: "Viewed a {entity}",
};

function formatAuditMessage(action: string, entity: string): string {
  const upper = action.toUpperCase();
  const template = actionMessages[upper]
    ?? actionMessages[upper.split("_")[0]]
    ?? `${humanizeEntity(action)} ${humanizeEntity(entity) || "record"}`;
  return template.replace("{entity}", humanizeEntity(entity).toLowerCase());
}

type ActionFilter = { action: string; count: number };

export function AuditLogTable({
  logs,
  total,
  page,
  pageSize,
  totalPages,
  actionCounts,
}: {
  logs: Log[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  actionCounts: ActionFilter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const action = searchParams.get("action") ?? "ALL";
  const totalAll = actionCounts.reduce((sum, a) => sum + a.count, 0);
  const isFiltered = action !== "ALL";

  // Filtering and paging both happen in the query, so both live in the URL.
  function navigate(updates: Record<string, string | null>, { resetPage = true } = {}) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // A deep page number can land past the end of a narrower result set.
    if (resetPage) next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  if (totalAll === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No audit entries</p>
        <p className="text-sm text-muted-foreground">System events will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <select
          value={action}
          onChange={(e) => navigate({ action: e.target.value === "ALL" ? null : e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All actions ({totalAll})</option>
          {actionCounts.map((a) => (
            <option key={a.action} value={a.action}>
              {a.action} ({a.count})
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground sm:ml-auto">
          <span className="font-semibold text-foreground">{total}</span> entr{total === 1 ? "y" : "ies"}
          {isFiltered && <span> · filtered</span>}
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="font-medium">No entries match this action</p>
          <Button variant="outline" size="sm" onClick={() => navigate({ action: null })}>
            Clear filter
          </Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const c = actionColor(log.action);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell className="font-medium">{log.actor?.name || "System"}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm"
                        style={{
                          backgroundColor: c.bg,
                          color: c.fg,
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: c.ring,
                        }}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAuditMessage(log.action, log.entityType)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={total}
            pageSize={pageSize}
            onPageChange={(p) => navigate({ page: p === 1 ? null : String(p) }, { resetPage: false })}
          />
        </>
      )}
    </>
  );
}
