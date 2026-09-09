"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, Loader2, User, Mail, Calendar, AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { updateMyProfile } from "@/lib/actions/profile";
import { PhoneInput, combinePhone } from "@/components/ui/phone-input";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-sm font-semibold">{children}</h3>
    </div>
  );
}

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date | null;
  employee: {
    phone: string | null;
    dateOfBirth: Date | null;
    address: string | null;
  } | null;
};

export function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? profile.employee?.phone ?? "");
  const [dob, setDob] = useState(
    (profile.dateOfBirth ?? profile.employee?.dateOfBirth)
      ? new Date(profile.dateOfBirth ?? profile.employee!.dateOfBirth!).toISOString().slice(0, 10)
      : ""
  );
  const [address, setAddress] = useState(profile.employee?.address ?? "");

  const initialName = profile.name;
  const initialEmail = profile.email;
  const initialPhone = profile.phone ?? profile.employee?.phone ?? "";
  const initialDob = (profile.dateOfBirth ?? profile.employee?.dateOfBirth)
    ? new Date(profile.dateOfBirth ?? profile.employee!.dateOfBirth!).toISOString().slice(0, 10)
    : "";
  const initialAddress = profile.employee?.address ?? "";

  const isDirty =
    name !== initialName ||
    email !== initialEmail ||
    phone !== initialPhone ||
    dob !== initialDob ||
    address !== initialAddress;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const result = await updateMyProfile({
      name,
      email,
      phone: phone || undefined,
      dateOfBirth: dob || undefined,
      address: address || undefined,
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="border-b bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-bold text-white">
              {getInitials(name || profile.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>Edit Profile</CardTitle>
            <p className="text-xs text-muted-foreground">
              Update your personal information
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <SectionTitle icon={User}>Personal</SectionTitle>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Used for sign in and notifications
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">Phone</Label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  defaultValue={profile.phone ?? profile.employee?.phone ?? ""}
                  onChange={(v) => setPhone(combinePhone(v))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-medium">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="pl-9"
                  max={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 18);
                    return d.toISOString().slice(0, 10);
                  })()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-medium">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="House / Flat, Street, City, State, PIN"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-orange-400 bg-orange-200 p-3 text-xs text-orange-950 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200">
            <p className="font-semibold">Note</p>
            <p className="mt-0.5 font-medium">
              Employment details like designation, department, bank, and statutory
              information can only be updated by an administrator. Contact your HR admin
              for changes to those fields.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Profile updated successfully.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button
              type="submit"
              disabled={loading || !isDirty}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
