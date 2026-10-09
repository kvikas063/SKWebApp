import { PageHeader } from "@/components/ui/page-header";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="space-y-6 px-4 pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>
        <PageHeader
          title="Terms of Service"
          description="Terms and conditions for using HRMS Suite"
          icon={FileText}
        />
        <Card>
          <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-muted-foreground">
            <p>By accessing or using HRMS Suite, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            <h3 className="text-base font-semibold text-foreground">Acceptance of Terms</h3>
            <p>These terms apply to all users, employees, and administrators of the HRMS Suite platform. Your continued use of the service constitutes acceptance of any updates to these terms.</p>
            <h3 className="text-base font-semibold text-foreground">User Responsibilities</h3>
            <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. Any misuse should be reported immediately.</p>
            <h3 className="text-base font-semibold text-foreground">Limitation of Liability</h3>
            <p>HRMS Suite is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from the use of our service.</p>
            <h3 className="text-base font-semibold text-foreground">Contact Us</h3>
            <p>For questions regarding these terms, please reach out to legal@hrms-suite.com.</p>
          </CardContent>
        </Card>
      </div>
      <footer className="mt-auto border-t bg-card/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-2.5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-foreground/80">HRMS Suite</span>. All rights reserved.
          </p>
          <span>HRMS Suite v1.0</span>
        </div>
      </footer>
    </div>
  );
}
