import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getCompany } from "@/lib/actions/company";
import { requireAdmin } from "@/lib/rbac";
import { SettingsForm } from "./settings-form";
import { Settings as SettingsIcon, Building2 } from "lucide-react";

export default async function SettingsPage() {
  await requireAdmin();
  const company = await getCompany();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company profile and statutory configuration"
        icon={SettingsIcon}
      />
      {company ? (
        <SettingsForm company={company} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No company configured</p>
            <p className="text-sm text-muted-foreground">Run the seed script to set up your company.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
