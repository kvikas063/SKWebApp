"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Employee, EmployeeDocument, SalaryComponent, LeaveBalance } from "@prisma/client";
import {
  Download,
  FileText,
  Wallet,
  User,
  Landmark,
  Palmtree,
  Hash,
  Mail,
  Phone,
  Calendar,
  CalendarDays,
  IdCard,
  CreditCard,
  Eye,
  Trash2,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatINR, paiseToRupees } from "@/lib/money";
import { DocumentPreviewDialog } from "@/components/documents/document-preview-dialog";

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card/50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-0.5 text-sm font-medium ${mono ? "font-mono" : ""}`}>
          {value || <span className="text-muted-foreground">—</span>}
        </p>
      </div>
    </div>
  );
}

function OverviewTab({
  employee,
  customDeductions,
  pf,
  esi,
  pt,
  tds,
}: {
  employee: Employee & {
    salaryComponents: SalaryComponent[];
    documents: EmployeeDocument[];
    leaveBalances: LeaveBalance[];
  };
  customDeductions: number;
  pf: { employee: number; employer: number };
  esi: { employee: number; employer: number };
  pt: number;
  tds: number;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Deductions Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">PF (Employee)</p>
              <p className="text-sm font-semibold">{formatINR(pf.employee)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">ESI (Employee)</p>
              <p className="text-sm font-semibold">{formatINR(esi.employee)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Professional Tax</p>
              <p className="text-sm font-semibold">{formatINR(pt)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">TDS (Income Tax)</p>
              <p className="text-sm font-semibold">{formatINR(tds)}</p>
            </div>
          </div>
          {customDeductions > 0 && (
            <div className="mt-3 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Other Deductions</p>
              <p className="text-sm font-semibold">{formatINR(customDeductions)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-indigo-600" />
              Personal Information
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={Hash} label="Employee Code" value={employee.employeeCode} mono />
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              <InfoRow icon={Phone} label="Phone" value={employee.phone} />
              <InfoRow icon={Calendar} label="Date of Joining" value={formatDate(employee.dateOfJoining)} />
              <InfoRow
                icon={CalendarDays}
                label="Date of Birth"
                value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null}
              />
              <InfoRow
                icon={IdCard}
                label="Tax Regime"
                value={employee.taxRegime === "NEW" ? "New Regime" : "Old Regime"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4 text-indigo-600" />
              Bank Details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={Landmark} label="Bank Name" value={employee.bankName} />
              <InfoRow icon={CreditCard} label="Account Number" value={employee.bankAccountNo} mono />
              <InfoRow icon={Hash} label="IFSC" value={employee.bankIfsc} mono />
              <InfoRow icon={IdCard} label="PAN" value={employee.pan} mono />
              <InfoRow icon={Hash} label="UAN (PF)" value={employee.uan} mono />
              <InfoRow icon={Hash} label="ESI Number" value={employee.esiNumber} mono />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Salary Components
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {employee.salaryComponents.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No salary components configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Component</th>
                    <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.salaryComponents.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3">
                        <Badge variant={c.type === "EARNING" ? "success" : "destructive"}>
                          {c.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">
                        ₹{paiseToRupees(c.amountPaise).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({
  documents,
  userRole,
}: {
  documents: EmployeeDocument[];
  userRole: string;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

  async function handleDownload(doc: EmployeeDocument) {
    setDownloadingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to download");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(doc: EmployeeDocument) {
    const confirmed = window.confirm(`Are you sure you want to delete "${doc.fileName}"?`);
    if (!confirmed) return;

    setDeletingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Delete failed");
      }

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

   return (
     <>
       <Card>
         <CardContent className="p-0">
           {documents.length === 0 ? (
             <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
               <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                 <FileText className="h-6 w-6 text-muted-foreground" />
               </div>
               <p className="font-medium">No documents yet</p>
               <p className="text-sm text-muted-foreground">
                 Documents shared by the company will appear here.
               </p>
             </div>
           ) : (
             <div className="divide-y">
               {documents.map((doc) => (
                 <div key={doc.id} className="flex items-center justify-between gap-4 p-4">
                   <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
                       <FileText className="h-5 w-5" />
                     </div>
                     <div className="min-w-0">
                       <p className="truncate text-sm font-medium">{doc.fileName}</p>
                       <p className="text-xs text-muted-foreground">
                         {doc.type.replace("_", " ")} · {formatDate(doc.uploadedAt)}
                         {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(1)} KB` : ""}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         Uploaded on {formatDateTime(doc.uploadedAt)}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 shrink-0">
                     <Button
                       size="sm"
                       variant="ghost"
                       onClick={() => setPreviewDoc(doc)}
                       title="Preview"
                     >
                       <Eye className="h-3.5 w-3.5" />
                     </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => handleDownload(doc)}
                       disabled={downloadingId === doc.id}
                     >
                       {downloadingId === doc.id ? (
                         "Downloading..."
                       ) : (
                         <>
                           <Download className="mr-1.5 h-3.5 w-3.5" />
                           Download
                         </>
                       )}
                      </Button>
                      {userRole !== "ADMIN" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                        >
                          {deletingId === doc.id ? (
                            "Deleting..."
                          ) : (
                            <>
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
       {previewDoc && (
         <DocumentPreviewDialog
           open={!!previewDoc}
           onOpenChange={(open) => !open && setPreviewDoc(null)}
           documentId={previewDoc.id}
           fileName={previewDoc.fileName}
         />
       )}
     </>
   );
 }

function LeaveTab({
  leaveBalances,
}: {
  leaveBalances: LeaveBalance[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palmtree className="h-4 w-4" />
          Leave Balances ({new Date().getFullYear()})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {leaveBalances.map((b) => {
            const available = b.entitled + b.carriedOver - b.used;
            const total = b.entitled + b.carriedOver;
            const pct = total > 0 ? Math.min(100, Math.round((b.used / total) * 100)) : 0;
            return (
              <div key={b.id} className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{b.leaveType}</p>
                <p className="mt-1 text-2xl font-bold">{available}<span className="text-sm font-normal text-muted-foreground">d</span></p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {b.used} used of {total} days
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeeTabs({
  employee,
  userRole,
  customDeductions,
  pf,
  esi,
  pt,
  tds,
}: {
  employee: Employee & {
    salaryComponents: SalaryComponent[];
    documents: EmployeeDocument[];
    leaveBalances: LeaveBalance[];
  };
  userRole: string;
  customDeductions: number;
  pf: { employee: number; employer: number };
  esi: { employee: number; employer: number };
  pt: number;
  tds: number;
}) {
  const [tab, setTab] = useState("overview");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
        {(userRole === "EMPLOYEE" || userRole === "ADMIN") && (
          <TabsTrigger value="documents" className="flex-1 sm:flex-none">My Documents</TabsTrigger>
        )}
        <TabsTrigger value="leave" className="flex-1 sm:flex-none">Leave Balances</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <OverviewTab
          employee={employee}
          customDeductions={customDeductions}
          pf={pf}
          esi={esi}
          pt={pt}
          tds={tds}
        />
      </TabsContent>
      <TabsContent value="documents">
        <DocumentsTab documents={employee.documents} userRole={userRole} />
      </TabsContent>
      <TabsContent value="leave">
        <LeaveTab leaveBalances={employee.leaveBalances} />
      </TabsContent>
    </Tabs>
  );
}
