import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimiters, getRateLimitIdentifier } from "./ratelimit";

type RateLimitType = keyof typeof rateLimiters;

async function resolveAuthenticatedUserId(
  request: NextRequest
): Promise<string | undefined> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const tokenUserId =
      (typeof token?.id === "string" && token.id.trim()) ||
      (typeof token?.sub === "string" && token.sub.trim()) ||
      undefined;

    return tokenUserId;
  } catch {
    // Fall back to IP-based limiting when auth token parsing fails.
    return undefined;
  }
}

/**
 * Higher-order function to add rate limiting to API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limitType: RateLimitType = "api"
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const limiter = rateLimiters[limitType];
    const userId = await resolveAuthenticatedUserId(request);
    const identifier = getRateLimitIdentifier(request, userId);

    try {
      const { success, limit, remaining, reset } = await limiter.limit(identifier);

      if (!success) {
        const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
        return NextResponse.json(
          {
            message: "Too many requests. Please try again later.",
            limit,
            remaining: 0,
            reset,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }

      const response = await handler(request);

      // Add rate limit headers to successful responses
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());

      return response;
    } catch (error) {
      // Redis failure - fail closed for security
      console.error("Rate limiter error:", error);
      return NextResponse.json(
        { message: "Service temporarily unavailable" },
        { status: 503 }
      );
    }
  };
}
