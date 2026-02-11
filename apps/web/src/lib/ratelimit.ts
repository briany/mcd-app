import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client (with fallback for development)
let redis: Redis | undefined;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isProduction = process.env.NODE_ENV === "production";
const hasRedisConfig = Boolean(redisUrl && redisToken);
const missingRedisConfigError =
  "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured in production";

if (hasRedisConfig) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

// In-memory fallback for development/testing
const inMemoryLimiter = {
  limit: async () => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  }),
};

// Fail-closed fallback for production misconfiguration
const failClosedLimiter = {
  limit: async () => {
    throw new Error(missingRedisConfigError);
  },
};

const fallbackLimiter = isProduction ? failClosedLimiter : inMemoryLimiter;

/**
 * Rate limiters for different operations
 * Falls back to in-memory (always allows) in non-production if Redis not configured.
 * Fails closed in production when Redis config is missing.
 */
export const rateLimiters = redis
  ? {
      // General API calls: 100 requests per minute
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
      }),

      // Write operations: 10 requests per minute
      write: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "ratelimit:write",
      }),

      // Auto-claim: 5 requests per hour (very restrictive)
      autoClaim: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: true,
        prefix: "ratelimit:autoclaim",
      }),
    }
  : {
      api: fallbackLimiter,
      write: fallbackLimiter,
      autoClaim: fallbackLimiter,
    };

function getFirstHeaderValue(
  request: Request,
  headerName: string
): string | undefined {
  const value = request.headers.get(headerName);
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const forwardedIp = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find((part) => part.length > 0);

    if (forwardedIp) {
      return forwardedIp;
    }
  }

  const realIp = getFirstHeaderValue(request, "x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cloudflareIp = getFirstHeaderValue(request, "cf-connecting-ip");
  if (cloudflareIp) {
    return cloudflareIp;
  }

  return "unknown";
}

/**
 * Get identifier for rate limiting (IP or user ID)
 *
 * SECURITY NOTE: IP-based rate limiting relies on x-forwarded-for and x-real-ip
 * headers which can be spoofed. This is only secure when deployed behind a trusted
 * reverse proxy (Vercel, Cloudflare, nginx) that strips client-provided forwarding
 * headers and sets its own. Ensure your deployment environment is configured correctly.
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID if available (more accurate for authenticated users)
  const normalizedUserId = userId?.trim();
  if (normalizedUserId) {
    return `user:${normalizedUserId}`;
  }

  return `ip:${getClientIp(request)}`;
}
