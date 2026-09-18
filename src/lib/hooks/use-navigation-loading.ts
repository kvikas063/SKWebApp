"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  function navigateWithLoading(href: string) {
    setIsNavigating(true);
    router.push(href);
  }

  return { isNavigating, navigateWithLoading };
}