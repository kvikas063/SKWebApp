import { cn } from "@/lib/utils";

/**
 * A single pulsing placeholder block. Composed into shapes by the
 * `loading.tsx` route boundaries, which let Next.js prefetch a route's shell
 * without rendering the whole page.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
