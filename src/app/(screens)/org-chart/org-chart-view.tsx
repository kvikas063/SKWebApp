"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import type { OrgNode } from "@/lib/actions/org-chart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ZoomIn, ZoomOut, Maximize2, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const palette = [
  "from-indigo-500 to-violet-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
  "from-sky-500 to-blue-500",
  "from-green-500 to-emerald-500",
];

function NodeCard({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasReports = node.reports.length > 0;
  const paletteColor = palette[depth % palette.length];

  return (
    <div className="flex items-stretch">
      <div className="relative flex items-center">
        <div
          className={cn(
            "group relative w-44 shrink-0 rounded-xl border bg-card p-2.5 shadow-sm transition-all hover:shadow-md",
            !node.isActive && "opacity-60"
          )}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-white/50 dark:ring-slate-800/50">
              <AvatarFallback className={cn("bg-gradient-to-br text-[10px] font-bold text-white", paletteColor)}>
                {getInitials(node.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight">{node.name}</p>
              {node.designation && (
                <p className="truncate text-[10px] text-muted-foreground">{node.designation}</p>
              )}
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            {node.department && (
              <span className="truncate rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {node.department}
              </span>
            )}
            {hasReports && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[9px] text-muted-foreground">
                <Users className="h-2.5 w-2.5" />
                {node.reports.length}
              </span>
            )}
          </div>
          {hasReports && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="absolute -right-3 top-1/2 z-30 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={expanded ? "Collapse reports" : "Expand reports"}
              title={expanded ? "Collapse reports" : "Expand reports"}
            >
              {expanded ? <ChevronRight className="h-3 w-3" /> : <ChevronRight className="h-3 w-3 rotate-180" />}
            </button>
          )}
        </div>
      </div>

      {hasReports && expanded && (
        <ChildrenBranch nodes={node.reports} depth={depth + 1} />
      )}
    </div>
  );
}

function ChildrenBranch({ nodes, depth }: { nodes: OrgNode[]; depth: number }) {
  const count = nodes.length;
  const isMulti = count > 1;

  return (
    <div className="flex items-stretch pl-6">
      <div className="relative flex flex-col">
        {nodes.map((child, i) => {
          const isFirst = i === 0;
          const isLast = i === count - 1;
          return (
            <div key={child.id} className="relative flex flex-1 items-center">
              {isMulti && (
                <>
                  <div
                    className={cn("absolute left-0 w-px bg-border")}
                    style={{
                      top: isFirst ? "50%" : 0,
                      bottom: isLast ? "50%" : 0,
                    }}
                  />
                  <div className="absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 bg-border" />
                </>
              )}
              {!isMulti && (
                <div className="absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 bg-border" />
              )}
              <div className="pl-6">
                <NodeCard node={child} depth={depth} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 0.35;

export function OrgChartView({
  tree,
  onRequestFullscreen,
}: {
  tree: OrgNode[];
  onRequestFullscreen?: () => void;
}) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [userZoomed, setUserZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const zoomIn = useCallback(() => { setUserZoomed(true); setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM)); }, []);
  const zoomOut = useCallback(() => { setUserZoomed(true); setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM)); }, []);
  const reset = useCallback(() => {
    setUserZoomed(false);
    setZoom(DEFAULT_ZOOM);
    containerRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }, []);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const chart = chartRef.current;
    if (!container || !chart) return;
    const cw = container.clientWidth - 32;
    const ch = container.clientHeight - 32;
    const nw = chart.scrollWidth;
    const nh = chart.scrollHeight;
    if (nw <= 0 || nh <= 0 || cw <= 0 || ch <= 0) return;
    setNaturalSize({ w: nw, h: nh });
    const fit = Math.min(cw / nw, ch / nh, 1);
    if (!userZoomed) setZoom(Math.max(MIN_ZOOM, fit));
  }, [tree, userZoomed]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const nw = chart.scrollWidth;
    const nh = chart.scrollHeight;
    if (nw > 0 && nh > 0) setNaturalSize({ w: nw, h: nh });
  }, [tree]);

  useEffect(() => {
    function onResize() {
      const container = containerRef.current;
      const chart = chartRef.current;
      if (!container || !chart) return;
      const cw = container.clientWidth - 32;
      const ch = container.clientHeight - 32;
      const nw = chart.scrollWidth;
      const nh = chart.scrollHeight;
      if (nw <= 0 || nh <= 0 || cw <= 0 || ch <= 0) return;
      setNaturalSize({ w: nw, h: nh });
      const fit = Math.min(cw / nw, ch / nh, 1);
      if (!userZoomed) setZoom(Math.max(MIN_ZOOM, fit));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [userZoomed]);

  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!containerRef.current?.contains(e.target as Node)) return;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomIn, zoomOut]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    if ((e.target as HTMLElement).closest("button, a, [role='button']")) return;
    isPanningRef.current = true;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanningRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    el.scrollLeft = panStartRef.current.scrollLeft - dx;
    el.scrollTop = panStartRef.current.scrollTop - dy;
  }

  function endPan(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setIsPanning(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute bottom-3 right-3 z-20 flex flex-col items-stretch gap-1 rounded-xl border border-indigo-200/60 bg-background/90 p-1 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/10 backdrop-blur">
        <Button size="icon" variant="ghost" onClick={zoomIn} className="h-8 w-8" aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="flex h-8 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-1 text-[10px] font-bold tabular-nums text-foreground shadow-inner">
          {Math.round(zoom * 100)}%
        </div>
        <Button size="icon" variant="ghost" onClick={zoomOut} className="h-8 w-8" aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="mx-1 my-0.5 h-px bg-border/60" />
        {onRequestFullscreen ? (
          <Button size="icon" variant="ghost" onClick={onRequestFullscreen} className="h-8 w-8" aria-label="Open in fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" onClick={reset} className="h-8 w-8" aria-label="Reset to default zoom">
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onPointerLeave={endPan}
        className={cn(
          "h-full w-full select-none overflow-auto rounded-lg border bg-slate-50/40 dark:bg-slate-900/30",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ minHeight: 280, maxHeight: "100%", touchAction: "pan-y" }}
      >
        <div
          className="flex min-h-full min-w-full items-center justify-center"
          style={{
            width: naturalSize ? `${naturalSize.w * zoom}px` : undefined,
            height: naturalSize ? `${naturalSize.h * zoom}px` : undefined,
            margin: "auto",
            padding: `${16 * zoom}px`,
            transition: "width 150ms ease-out, height 150ms ease-out",
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 150ms ease-out",
            }}
          >
            <div ref={chartRef} className="flex items-stretch gap-6">
              {tree.map((root) => (
                <NodeCard key={root.id} node={root} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
