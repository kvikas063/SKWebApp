"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mounted in the persistent AppShell layout. Its effect re-runs on every
// client-side navigation (pathname changes while the component stays mounted),
// signaling PageLoadingBar that the new route's client bundle has hydrated.
// Without this the loader would dismiss mid-download and leave a blank frame
// until the bundle finishes parsing.
export function HydrationReporter() {
  const pathname = usePathname();
  useEffect(() => {
    const win = window as unknown as { __pageReady?: () => void };
    if (typeof win.__pageReady === "function") {
      win.__pageReady();
    }
  }, [pathname]);
  return null;
}