import { PageHeader } from "@/components/ui/page-header";
import { ChangePasswordForm } from "./change-password-form";
import { KeyRound, ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/rbac";

export default async function ChangePasswordPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Password"
        description="Keep your account secure by updating your password regularly"
        icon={KeyRound}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChangePasswordForm />
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-semibold">Why change your password?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  Protects your account from unauthorized access
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  Required after suspicious activity
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  Best practice every 90 days
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-400">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-muted-foreground">
                Your password is hashed with bcrypt before being stored. We never
                store or transmit passwords in plain text.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
