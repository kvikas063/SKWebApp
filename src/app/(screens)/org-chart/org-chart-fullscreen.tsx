"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Maximize2, X } from "lucide-react";
import { OrgChartView } from "./org-chart-view";
import type { OrgNode } from "@/lib/actions/org-chart";

export function OrgChartFullscreen({
  tree,
  open,
  onOpenChange,
  children,
}: {
  tree: OrgNode[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent
        className="left-0 top-0 max-w-none h-screen w-screen translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:rounded-none"
      >
        <div className="flex h-screen w-screen flex-col bg-slate-50 dark:bg-slate-950">
          <header className="flex items-center justify-between gap-3 border-b bg-background/80 px-5 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Organization Chart</DialogTitle>
                <DialogDescription className="text-xs">Fullscreen view</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Fullscreen
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
                aria-label="Close fullscreen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full w-full overflow-hidden rounded-xl border bg-card shadow-sm">
              <OrgChartView tree={tree} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OrgChartFullscreenButton({ tree }: { tree: OrgNode[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        Fullscreen
      </Button>
      <OrgChartFullscreen tree={tree} open={open} onOpenChange={setOpen} />
    </>
  );
}
