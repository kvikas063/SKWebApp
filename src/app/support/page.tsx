"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Mail, Send, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { sendSupportEmail } from "./actions";

export default function SupportPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await sendSupportEmail(formData);
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error);
    }
    setSending(false);
  }

  return (
    <div className="space-y-6 px-4 pt-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
      </Link>
      <PageHeader
        title="Support"
        description="Get help with HRMS Suite"
        icon={Mail}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-muted-foreground">
            <p>Our support team is here to help you with any questions or issues you may have while using HRMS Suite.</p>
            <h3 className="text-base font-semibold text-foreground">Email Support</h3>
            <p>For technical issues, account questions, or feature requests, email us at <strong>support@hrms-suite.com</strong>.</p>
            <h3 className="text-base font-semibold text-foreground">Response Time</h3>
            <p>We typically respond within 1-2 business days. For urgent matters, please mark your email as &quot;Urgent&quot; in the subject line.</p>
            <h3 className="text-base font-semibold text-foreground">Self-Help Resources</h3>
            <p>Check our documentation and FAQs on the Dashboard for quick answers to common questions.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {sent ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Message sent!</p>
                  <p className="mt-1 text-xs text-muted-foreground">We&apos;ll get back to you within 1-2 business days.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSent(false)}
                  className="mt-2"
                >
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Your Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Your Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@company.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-medium">Subject</Label>
                  <Input id="subject" name="subject" placeholder="e.g. Payroll issue" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-medium">Message</Label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Describe your issue or question..."
                    required
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-600"
                  />
                </div>
                {error && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
