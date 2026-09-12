import { Building2, Shield } from "lucide-react";

export function Footer({ companyName }: { companyName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-2.5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <Building2 className="h-3 w-3" />
          </div>
          <span className="font-semibold text-foreground/80">{companyName}</span>
          <span>© {year}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secure session
          </span>
          <span>HRMS Suite v1.0</span>
        </div>
      </div>
    </footer>
  );
}