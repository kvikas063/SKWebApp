import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getMyProfile } from "@/lib/actions/profile";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  Hash,
  CreditCard,
  Landmark,
  IdCard,
  KeyRound,
  Edit,
  ShieldCheck,
  Users as UsersIcon,
  UserCheck,
  MapPin,
} from "lucide-react";
import Link from "next/link";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  const emp = profile.employee;
  const fullName = emp ? `${emp.firstName} ${emp.lastName}` : profile.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View your personal and employment information"
        icon={UserIcon}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild className="bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:from-red-700 hover:to-rose-700">
              <Link href="/change-password">
                <KeyRound className="h-4 w-4" />
                Change Password
              </Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700">
              <Link href="/profile/edit">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.15),transparent_60%)]" />
        <CardContent className="relative flex flex-col items-start gap-4 px-6 py-8 sm:flex-row sm:items-center sm:gap-6 sm:py-10">
          <Avatar className="h-24 w-24 shrink-0 border-4 border-white/30 shadow-xl ring-2 ring-white/20">
            <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/5 text-3xl font-bold text-white backdrop-blur-sm">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{fullName}</h2>
            <p className="flex items-center gap-1.5 text-sm text-white/85">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm">
                <ShieldCheck className="h-3 w-3" />
                {profile.role === "ADMIN" ? "HR Admin" : profile.role}
              </span>
              {emp && (
                <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
                  {emp.employeeType.replace("_", " ")}
                </span>
              )}
              {emp?.designation && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                  <Briefcase className="h-3 w-3" />
                  {emp.designation}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <UserIcon className="h-4 w-4 text-indigo-600" />
              Personal Information
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={UserIcon} label="Full Name" value={fullName} />
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={profile.phone ?? emp?.phone}
              />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={
                  profile.dateOfBirth
                    ? formatDate(profile.dateOfBirth)
                    : emp?.dateOfBirth
                    ? formatDate(emp.dateOfBirth)
                    : null
                }
              />
              <div className="sm:col-span-2">
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={emp?.address}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {emp && (
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                Employment
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={Hash} label="Employee Code" value={emp.employeeCode} mono />
                <InfoRow icon={Building2} label="Department" value={emp.department} />
                <InfoRow icon={Briefcase} label="Designation" value={emp.designation} />
                <InfoRow
                  icon={UsersIcon}
                  label="Reports To"
                  value={
                    emp.manager
                      ? `${emp.manager.firstName} ${emp.manager.lastName}${emp.manager.designation ? ` (${emp.manager.designation})` : ""}`
                      : null
                  }
                />
                <InfoRow icon={Calendar} label="Date of Joining" value={formatDate(emp.dateOfJoining)} />
                <InfoRow
                  icon={UserCheck}
                  label="Tax Regime"
                  value={emp.taxRegime === "NEW" ? "New Regime" : "Old Regime"}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {emp && (
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4 text-indigo-600" />
                Bank Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={Landmark} label="Bank Name" value={emp.bankName} />
                <InfoRow icon={CreditCard} label="Account Number" value={emp.bankAccountNo} mono />
                <InfoRow icon={Hash} label="IFSC" value={emp.bankIfsc} mono />
              </div>
            </CardContent>
          </Card>
        )}

        {emp && (
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <IdCard className="h-4 w-4 text-indigo-600" />
                Statutory Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={IdCard} label="PAN" value={emp.pan} mono />
                <InfoRow icon={IdCard} label="Aadhaar" value={emp.aadhaar} mono />
                <InfoRow icon={Hash} label="UAN (PF)" value={emp.uan} mono />
                <InfoRow icon={Hash} label="ESI Number" value={emp.esiNumber} mono />
              </div>
            </CardContent>
          </Card>
        )}

        {emp?.company && (
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Company
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={Building2} label="Company Name" value={emp.company.name} />
                <InfoRow
                  icon={Mail}
                  label="Address"
                  value={
                    [emp.company.address, emp.company.city, emp.company.state]
                      .filter(Boolean)
                      .join(", ") || null
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Account created {formatDateTime(profile.createdAt)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
