"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCompany } from "@/lib/actions/company";
import { Pencil, Save, X, Check, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Company = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  pan: string | null;
  tan: string | null;
  pfNumber: string | null;
  esiNumber: string | null;
  statutoryConfig: {
    pfEmployeeRate: number;
    pfEmployerRate: number;
    pfWageCeilingPaise: number;
    esiWageThresholdPaise: number;
    esiEmployeeRate: number;
    esiEmployerRate: number;
  } | null;
};

function ReadOnlyField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex h-10 items-center rounded-md border border-dashed bg-muted/30 px-3 text-sm">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

export function SettingsForm({ company }: { company: Company }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEdit() {
    setEditing(true);
    setSaved(false);
    setError(null);
  }

  function handleCancel() {
    setEditing(false);
    setSaved(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await updateCompany({
        name: form.get("name") as string,
        address: (form.get("address") as string) || undefined,
        city: (form.get("city") as string) || undefined,
        state: (form.get("state") as string) || undefined,
        pincode: (form.get("pincode") as string) || undefined,
        pan: (form.get("pan") as string) || undefined,
        tan: (form.get("tan") as string) || undefined,
        pfNumber: (form.get("pfNumber") as string) || undefined,
        esiNumber: (form.get("esiNumber") as string) || undefined,
      });
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className={cn(editing && "border-indigo-300 dark:border-indigo-800")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Company Details</CardTitle>
              {editing && (
                <p className="mt-1 text-xs text-muted-foreground">Editing mode — changes will be saved when you click Save</p>
              )}
            </div>
            {!editing ? (
              <Button
                type="button"
                onClick={handleEdit}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
              >
                <Pencil className="h-4 w-4" />
                Edit Settings
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {loading ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input id="name" name="name" defaultValue={company.name} required autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input id="pan" name="pan" defaultValue={company.pan || ""} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" defaultValue={company.address || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={company.city || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" defaultValue={company.state || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" defaultValue={company.pincode || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tan">TAN</Label>
                  <Input id="tan" name="tan" defaultValue={company.tan || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pfNumber">PF Registration</Label>
                  <Input id="pfNumber" name="pfNumber" defaultValue={company.pfNumber || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="esiNumber">ESI Registration</Label>
                  <Input id="esiNumber" name="esiNumber" defaultValue={company.esiNumber || ""} />
                </div>
              </>
            ) : (
              <>
                <ReadOnlyField label="Company Name" value={company.name} />
                <ReadOnlyField label="PAN" value={company.pan} />
                <div className="md:col-span-2">
                  <ReadOnlyField label="Address" value={company.address} />
                </div>
                <ReadOnlyField label="City" value={company.city} />
                <ReadOnlyField label="State" value={company.state} />
                <ReadOnlyField label="Pincode" value={company.pincode} />
                <ReadOnlyField label="TAN" value={company.tan} />
                <ReadOnlyField label="PF Registration" value={company.pfNumber} />
                <ReadOnlyField label="ESI Registration" value={company.esiNumber} />
              </>
            )}
          </CardContent>
        </Card>

        {company.statutoryConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Statutory Rates
              </CardTitle>
              <p className="text-xs text-muted-foreground">These are configured per company policy and cannot be edited from the UI</p>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">PF Employee</p>
                <p className="text-lg font-semibold">{company.statutoryConfig.pfEmployeeRate}%</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">PF Employer</p>
                <p className="text-lg font-semibold">{company.statutoryConfig.pfEmployerRate}%</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">ESI Employee</p>
                <p className="text-lg font-semibold">{company.statutoryConfig.esiEmployeeRate}%</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">ESI Employer</p>
                <p className="text-lg font-semibold">{company.statutoryConfig.esiEmployerRate}%</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">ESI Threshold</p>
                <p className="text-lg font-semibold">₹{company.statutoryConfig.esiWageThresholdPaise / 100}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">PF Ceiling</p>
                <p className="text-lg font-semibold">₹{company.statutoryConfig.pfWageCeilingPaise / 100}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {saved && !editing && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            Settings saved successfully
          </div>
        )}
      </form>
    </div>
  );
}
