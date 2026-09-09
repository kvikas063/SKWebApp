"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changePassword } from "@/lib/actions/password";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

function PasswordInput({
  id,
  name,
  placeholder,
  value,
  onChange,
  required,
  minLength,
}: {
  id: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-10"
        required={required}
        minLength={minLength}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: "—", color: "bg-slate-200" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Too weak", color: "bg-rose-500" },
    { label: "Weak", color: "bg-orange-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-lime-500" },
    { label: "Strong", color: "bg-emerald-500" },
    { label: "Excellent", color: "bg-emerald-600" },
  ];
  return { score, ...levels[score] };
}

export function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const strength = passwordStrength(next);
  const matches = next && confirm && next === confirm;

  function handleCancel() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
    setSuccess(false);
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const result = await changePassword(current, next, confirm);
    if (!result.ok) {
      setError(result.error);
    } else {
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    }
    setLoading(false);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Change Password</CardTitle>
            <p className="text-xs text-muted-foreground">
              Update your account password securely
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="current" className="text-xs font-medium">Current Password</Label>
            <PasswordInput
              id="current"
              name="currentPassword"
              placeholder="Enter your current password"
              value={current}
              onChange={setCurrent}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next" className="text-xs font-medium">New Password</Label>
            <PasswordInput
              id="next"
              name="newPassword"
              placeholder="At least 8 characters"
              value={next}
              onChange={setNext}
              required
              minLength={8}
            />
            {next && (
              <div className="mt-2 space-y-1.5">
                <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-secondary">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 transition-colors ${
                        strength.score >= i ? strength.color : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-medium">Strength:</span>
                  <span>{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-xs font-medium">Confirm New Password</Label>
            <PasswordInput
              id="confirm"
              name="confirmPassword"
              placeholder="Re-enter new password"
              value={confirm}
              onChange={setConfirm}
              required
              minLength={8}
            />
            {confirm && (
              <p
                className={`mt-1 flex items-center gap-1.5 text-[11px] ${
                  matches ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {matches ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" /> Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-50">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
              <KeyRound className="h-3.5 w-3.5" />
              <span className="font-semibold">Password tips</span>
            </div>
            <ul className="mt-1.5 ml-5 list-disc space-y-0.5">
              <li>At least 8 characters long</li>
              <li>Mix of uppercase, lowercase, numbers, and symbols</li>
              <li>Avoid reusing passwords from other accounts</li>
            </ul>
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
              <span>Password changed successfully.</span>
            </div>
          )}

          <div className="flex items-center gap-2 border-t pt-4">
            <Button
              type="submit"
              disabled={loading || !matches || !current}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
