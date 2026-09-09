import { PageHeader } from "@/components/ui/page-header";
import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-6 px-4 pt-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
      </Link>
      <PageHeader
        title="Privacy Policy"
        description="How we collect, use, and protect your data"
        icon={Shield}
      />
      <Card>
        <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-muted-foreground">
          <p>This Privacy Policy describes how HRMS Suite collects, uses, and safeguards your personal information when you use our services.</p>
          <h3 className="text-base font-semibold text-foreground">Information We Collect</h3>
          <p>We collect information you provide directly to us, such as your name, email address, phone number, and employment details necessary for HR and payroll operations.</p>
          <h3 className="text-base font-semibold text-foreground">How We Use Your Information</h3>
          <p>Your data is used solely for managing HR processes including payroll, leave management, attendance tracking, and statutory compliance. We do not sell or share your personal data with third parties without your consent.</p>
          <h3 className="text-base font-semibold text-foreground">Data Security</h3>
          <p>We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your data.</p>
          <h3 className="text-base font-semibold text-foreground">Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@hrms-suite.com.</p>
        </CardContent>
      </Card>
    </div>
  );
}
