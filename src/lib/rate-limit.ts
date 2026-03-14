// ============================================================================
// Rate Limiting — Upstash Redis + @upstash/ratelimit
// ============================================================================
// Production-safe, serverless-friendly rate limiting via Upstash Redis.
// Two layers:
//   1. Per-user short window  — prevents burst abuse (sliding window)
//   2. Per-org daily cap      — enforces fair usage (fixed window, 24h)
//
// Gracefully degrades to "allow all" when Upstash env vars are missing
// (local dev / CI), so no hard dependency on Redis for development.
// ============================================================================

import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---- Types ----

export interface RateLimitResult {
  success: boolean;
  /** User-friendly error message when rate-limited */
  error?: string;
  /** Seconds until the limit resets */
  retryAfter?: number;
  /** Which layer triggered the limit */
  limitType?: "user" | "org";
}

// ---- Configuration ----

interface RateLimitConfig {
  /** Human-readable name for logging */
  name: string;
  /** Per-user: max requests within the window */
  userLimit: number;
  /** Per-user: window duration string (e.g. "60 s", "10 m") */
  userWindow: `${number} ${"s" | "m" | "h" | "d"}`;
  /** Per-org: max requests within the window */
  orgLimit: number;
  /** Per-org: window duration string */
  orgWindow: `${number} ${"s" | "m" | "h" | "d"}`;
}

// Pre-defined limiters for each action type
export const RATE_LIMITS = {
  aiGeneration: {
    name: "ai-generation",
    userLimit: 10,
    userWindow: "60 s",
    orgLimit: 200,
    orgWindow: "1 d",
  },
  csvImport: {
    name: "csv-import",
    userLimit: 5,
    userWindow: "60 s",
    orgLimit: 50,
    orgWindow: "1 d",
  },
  authAttempt: {
    name: "auth-attempt",
    userLimit: 10,
    userWindow: "60 s",
    orgLimit: 100,
    orgWindow: "1 d",
  },
} satisfies Record<string, RateLimitConfig>;

// ---- Redis client (singleton) ----

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Graceful degradation in development
    if (process.env.NODE_ENV !== "production") {
      return null;
    }
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing — rate limiting disabled"
    );
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// ---- Limiter cache (one per config name) ----

const userLimiters = new Map<string, Ratelimit>();
const orgLimiters = new Map<string, Ratelimit>();

function getUserLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  if (!userLimiters.has(config.name)) {
    userLimiters.set(
      config.name,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(
          config.userLimit,
          config.userWindow
        ),
        prefix: `rl:user:${config.name}`,
        analytics: true,
      })
    );
  }
  return userLimiters.get(config.name)!;
}

function getOrgLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  if (!orgLimiters.has(config.name)) {
    orgLimiters.set(
      config.name,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.fixedWindow(config.orgLimit, config.orgWindow),
        prefix: `rl:org:${config.name}`,
        analytics: true,
      })
    );
  }
  return orgLimiters.get(config.name)!;
}

// ---- Main check function ----

/**
 * Checks both per-user and per-org rate limits.
 * Returns `{ success: true }` if allowed, or a user-friendly error otherwise.
 *
 * @param config - One of the RATE_LIMITS presets
 * @param userId - Authenticated user ID
 * @param orgId  - Organization ID
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  userId: string,
  orgId: string
): Promise<RateLimitResult> {
  const userLimiter = getUserLimiter(config);
  const orgLimiter = getOrgLimiter(config);

  // Graceful degradation — no Redis client available
  if (!userLimiter || !orgLimiter) {
    return { success: true };
  }

  // Check both limits in parallel
  const [userResult, orgResult] = await Promise.all([
    userLimiter.limit(userId),
    orgLimiter.limit(orgId),
  ]);

  if (!userResult.success) {
    const retryAfter = Math.ceil(
      (userResult.reset - Date.now()) / 1000
    );
    console.warn(
      `[rate-limit] User ${userId} hit ${config.name} user limit (retry in ${retryAfter}s)`
    );
    return {
      success: false,
      error: `Too many requests. Please wait ${retryAfter > 60 ? `${Math.ceil(retryAfter / 60)} minutes` : `${retryAfter} seconds`} and try again.`,
      retryAfter,
      limitType: "user",
    };
  }

  if (!orgResult.success) {
    const retryAfter = Math.ceil(
      (orgResult.reset - Date.now()) / 1000
    );
    console.warn(
      `[rate-limit] Org ${orgId} hit ${config.name} org daily limit (retry in ${retryAfter}s)`
    );
    return {
      success: false,
      error:
        "Your organization has reached its daily limit for this action. Please try again tomorrow or upgrade your plan.",
      retryAfter,
      limitType: "org",
    };
  }

  return { success: true };
}
