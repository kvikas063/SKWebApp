"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SonnerToaster
      position="top-right"
      theme={theme === "system" ? undefined : (theme as "light" | "dark")}
      richColors
      expand={false}
      visibleToasts={5}
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        },
      }}
    />
  );
}