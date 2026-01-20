import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client (with fallback for development)
let redis: Redis | undefined;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// In-memory fallback for development/testing
const inMemoryLimiter = {
  limit: async (identifier: string) => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  }),
};

/**
 * Rate limiters for different operations
 * Falls back to in-memory (always allows) if Redis not configured
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
      api: inMemoryLimiter,
      write: inMemoryLimiter,
      autoClaim: inMemoryLimiter,
    };

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
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `ip:${ip}`;
}
