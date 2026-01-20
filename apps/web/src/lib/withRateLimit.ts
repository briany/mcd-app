import { NextRequest, NextResponse } from "next/server";
import { rateLimiters, getRateLimitIdentifier } from "./ratelimit";

type RateLimitType = keyof typeof rateLimiters;

/**
 * Higher-order function to add rate limiting to API routes
 */
export function withRateLimit<T extends (request?: NextRequest) => Promise<NextResponse>>(
  handler: T,
  limitType: RateLimitType = "api"
) {
  return async (request?: NextRequest) => {
    // Create a default request if none provided (for testing)
    const req = request || new NextRequest("http://localhost/test");

    const limiter = rateLimiters[limitType];
    const identifier = getRateLimitIdentifier(req);

    try {
      const { success, limit, remaining, reset } = await limiter.limit(identifier);

      if (!success) {
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
              "Retry-After": Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString(),
            },
          }
        );
      }

      const response = await handler(req);

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
