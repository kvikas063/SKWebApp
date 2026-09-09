"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        "text-[var(--sidebar-fg)]",
        "hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-strong)]"
      )}
    >
      {mounted && (
        <>
          <Sun
            className={cn(
              "h-4 w-4 transition-all",
              isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
            )}
          />
          <Moon
            className={cn(
              "absolute h-4 w-4 transition-all",
              isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
            )}
          />
        </>
      )}
    </button>
  );
}
