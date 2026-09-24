"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PageLoadingBar() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Dismiss the overlay once the destination route has loaded
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, visible]);

  useEffect(() => {
    const handlers = {
      start: () => setVisible(true),
      done: () => setVisible(false),
    };
    (window as unknown as { __pageLoading?: typeof handlers }).__pageLoading = handlers;
    return () => {
      delete (window as unknown as { __pageLoading?: typeof handlers }).__pageLoading;
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-sm"
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