import { PageHeader } from "@/components/ui/page-header";
import { getMyProfile } from "@/lib/actions/profile";
import { EditProfileForm } from "./edit-profile-form";
import { User, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditProfilePage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
      </Link>
      <PageHeader
        title="Edit Profile"
        description="Update your personal information"
        icon={User}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EditProfileForm profile={profile} />
        </div>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-400">
              <Info className="h-4 w-4" />
            </div>
            <h3 className="font-semibold">What can you edit?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                Your full name
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                Email address
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                Phone number
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                Date of birth
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                Residential address
              </li>
            </ul>
            <p className="border-t pt-3 text-xs text-muted-foreground">
              Changes are logged in the audit trail.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
