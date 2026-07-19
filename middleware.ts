import { NextResponse, type NextRequest } from "next/server";

/**
 * Best-effort sliding-window rate limiter for /api/v1/*.
 *
 * LIMITATIONS (serverless):
 * - The Map below is per-instance; on Vercel each cold-start gets a fresh Map,
 *   so limits are not enforced across concurrent instances.
 * - Under heavy traffic several instances may all grant requests for the same IP.
 * - For true cross-instance rate limiting, replace with @vercel/kv or Upstash.
 *
 * For a small read-only public API this "best-effort" is sufficient to blunt
 * accidental hammering from a single bot or misconfigured client.
 */

const WINDOW_MS = 60_000; // 1 minute
const LIMIT = 60; // requests per window per IP

interface WindowEntry {
  count: number;
  reset: number;
}

const store = new Map<string, WindowEntry>();

// Prune stale entries every 5 minutes to avoid unbounded memory growth.
let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 300_000) return;
  lastPrune = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.reset) store.delete(key);
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/v1/")) return NextResponse.next();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  maybePrune();

  const entry = store.get(ip);
  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count += 1;
  if (entry.count > LIMIT) {
    const retryAfterSec = Math.ceil((entry.reset - now) / 1000);
    return new NextResponse(
      JSON.stringify({
        error: "rate_limited",
        message: `Too many requests — max ${LIMIT} per minute per IP.`,
        retry_after_seconds: retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(LIMIT),
          "X-RateLimit-Reset": String(Math.ceil(entry.reset / 1000)),
        },
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(LIMIT));
  res.headers.set("X-RateLimit-Remaining", String(Math.max(0, LIMIT - entry.count)));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.reset / 1000)));
  return res;
}

export const config = {
  matcher: "/api/v1/:path*",
};
