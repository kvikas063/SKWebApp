"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// Upper bound on how long the overlay stays up after a nav click. The real
// dismissal happens earlier via __pageReady (HydrationReporter) once the new
// route's client bundle has downloaded, parsed and hydrated.
const MAX_HOLD_MS = 8000;
// Never show the overlay for less than this long, otherwise rapid in-page
// toggles would flash it.
const MIN_VISIBLE_MS = 250;

export function PageLoadingBar() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSinceRef = useRef<number | null>(null);

  function clearTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function dismissNow() {
    clearTimer();
    setVisible(false);
    visibleSinceRef.current = null;
  }

  function start() {
    clearTimer();
    visibleSinceRef.current = Date.now();
    setVisible(true);
  }

  function done() {
    scheduleHide();
  }

  function scheduleHide() {
    clearTimer();
    const since = visibleSinceRef.current ?? Date.now();
    const remaining = Math.max(
      MIN_VISIBLE_MS,
      MAX_HOLD_MS - (Date.now() - since)
    );
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      visibleSinceRef.current = null;
      hideTimerRef.current = null;
    }, remaining);
  }

  // Expose start/done to the sidebar's nav click handler, and expose
  // dismissNow as __pageReady so HydrationReporter can dismiss the overlay
  // as soon as the new route's client bundle has hydrated. Empty deps: we
  // only want to wire these once on mount.
  useEffect(() => {
    const win = window as unknown as {
      __pageLoading?: { start: () => void; done: () => void };
      __pageReady?: () => void;
    };
    win.__pageLoading = { start, done };
    win.__pageReady = dismissNow;
    return () => {
      delete win.__pageLoading;
      if (typeof win.__pageReady === "function" && win.__pageReady === dismissNow) {
        delete win.__pageReady;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the pathname changes, the destination route's server HTML has
  // streamed in. Start the long hold timer; HydrationReporter will dismiss
  // early once the client bundle hydrates.
  useEffect(() => {
    if (!visible) return;
    scheduleHide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm"
      style={{ pointerEvents: "none" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/40">
          <Loader2 className="h-7 w-7 animate-spin text-white" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}