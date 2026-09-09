"use client";

import { OrgChartView } from "./org-chart-view";
import { OrgChartFullscreen } from "./org-chart-fullscreen";
import type { OrgNode } from "@/lib/actions/org-chart";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

export function OrgChartContainer({ tree }: { tree: OrgNode[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Company Hierarchy</h3>
            <p className="text-sm text-muted-foreground">Click a node to view direct reports</p>
          </div>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Open in fullscreen
        </Button>
        </div>
      </div>
      <div className="px-4 pb-4 pt-2" style={{ height: "calc(100vh - 360px)" }}>
        <OrgChartView tree={tree} onRequestFullscreen={() => setOpen(true)} />
      </div>
      <OrgChartFullscreen tree={tree} open={open} onOpenChange={setOpen} />
    </>
  );
}

