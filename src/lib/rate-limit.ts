import { NextResponse } from "next/server";

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

interface SlidingWindow {
  timestamps: number[];
}

const stores = new Map<string, Map<string, SlidingWindow>>();

export function createRateLimiter(name: string, opts: RateLimiterOptions) {
  const store = new Map<string, SlidingWindow>();
  stores.set(name, store);

  // Auto-prune stale entries every 60s
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, window] of store) {
      window.timestamps = window.timestamps.filter((t) => now - t < opts.windowMs);
      if (window.timestamps.length === 0) store.delete(key);
    }
  }, 60_000);
  interval.unref?.();

  return {
    check(key: string): { allowed: boolean; retryAfterMs: number } {
      const now = Date.now();
      let window = store.get(key);
      if (!window) {
        window = { timestamps: [] };
        store.set(key, window);
      }

      // Remove expired timestamps
      window.timestamps = window.timestamps.filter((t) => now - t < opts.windowMs);

      if (window.timestamps.length >= opts.maxRequests) {
        const oldest = window.timestamps[0];
        const retryAfterMs = oldest + opts.windowMs - now;
        return { allowed: false, retryAfterMs };
      }

      window.timestamps.push(now);
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

export function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Слишком много запросов. Попробуйте позже." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    },
  );
}
