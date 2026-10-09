// Simple in-memory sliding-window rate limiter.
//
// NOTE: on Vercel each cold container holds its own state, so this only
// limits bursts within a single warm container. For production-grade
// enforcement across all containers, swap this for Upstash Redis
// (@upstash/ratelimit) pointed at a REDIS_URL env var. The API surface is
// identical, so the swap is a drop-in.
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 10; // per IP per window

const store = new Map<string, number[]>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const attempts = store.get(key) ?? [];
  const recent = attempts.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return false;
  recent.push(now);
  store.set(key, recent);
  return true;
}

// Periodically prune so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of store) {
    const recent = attempts.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) store.delete(key);
    else store.set(key, recent);
  }
}, 60 * 1000).unref?.();