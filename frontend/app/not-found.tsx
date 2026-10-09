import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background p-4">
      <Card className="w-full max-w-2xl border-white/20 shadow-2xl shadow-indigo-500/10">
        <div className="relative h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-500/30">
            <AlertTriangle className="h-8 w-8" strokeWidth={2} />
          </div>

          <div className="space-y-1.5">
            <p className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">404</p>
            <p className="text-sm text-muted-foreground sm:text-base">
              We couldn&apos;t find the page you were looking for. It may have been deleted, renamed, or the link might be broken.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700">
              <Link href="/dashboard">
                <Home className="h-3.5 w-3.5" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/org-chart/list?tab=employees">
                <ArrowLeft className="h-3.5 w-3.5" />
                Browse Employees
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}