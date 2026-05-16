import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimitKind = "duck" | "run";

export interface LimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSec: number;
  scope?: "minute" | "day";
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const enabled = Boolean(url && token);

const redis = enabled ? new Redis({ url: url!, token: token! }) : null;

function make(name: string, limit: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    prefix: `quode:${name}`,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
  });
}

const limiters = {
  // Gemini free tier is 5 RPM per model — keep ours strictly below that so the
  // app's limiter triggers first instead of leaking Google's raw 429.
  duckMinute: make("duck:m", 4, "1 m"),
  duckDay: make("duck:d", 50, "1 d"),
  runMinute: make("run:m", 30, "1 m"),
  runDay: make("run:d", 200, "1 d"),
} as const;

export function isRateLimitEnabled(): boolean {
  return enabled;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}

export async function checkLimit(
  kind: LimitKind,
  ip: string,
): Promise<LimitResult> {
  if (!enabled) {
    return {
      ok: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
      retryAfterSec: 0,
    };
  }

  const [minute, day] =
    kind === "duck"
      ? [limiters.duckMinute, limiters.duckDay]
      : [limiters.runMinute, limiters.runDay];

  const [mRes, dRes] = await Promise.all([
    minute!.limit(ip),
    day!.limit(ip),
  ]);

  if (!mRes.success) {
    const retry = Math.max(1, Math.ceil((mRes.reset - Date.now()) / 1000));
    return {
      ok: false,
      limit: mRes.limit,
      remaining: mRes.remaining,
      reset: mRes.reset,
      retryAfterSec: retry,
      scope: "minute",
    };
  }
  if (!dRes.success) {
    const retry = Math.max(1, Math.ceil((dRes.reset - Date.now()) / 1000));
    return {
      ok: false,
      limit: dRes.limit,
      remaining: dRes.remaining,
      reset: dRes.reset,
      retryAfterSec: retry,
      scope: "day",
    };
  }
  return {
    ok: true,
    limit: dRes.limit,
    remaining: dRes.remaining,
    reset: dRes.reset,
    retryAfterSec: 0,
  };
}

export function rateLimitHeaders(r: LimitResult): Record<string, string> {
  if (!Number.isFinite(r.limit)) return {};
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(Math.max(0, r.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(r.reset / 1000)),
  };
}
