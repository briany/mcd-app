import { NextRequest, NextResponse } from "next/server";
import { rateLimiters, getRateLimitIdentifier } from "./ratelimit";

type RateLimitType = keyof typeof rateLimiters;

/**
 * Higher-order function to add rate limiting to API routes
 *
 * This function wraps Next.js API route handlers with rate limiting logic.
 * The wrapped function accepts a request parameter. For testing, the parameter
 * can be omitted and a mock request will be created.
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limitType: RateLimitType = "api"
): (request: NextRequest) => Promise<NextResponse> {
  const wrappedHandler = async (request: NextRequest) => {
    const req = request;

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

  // For testing: allow calling without arguments
  return new Proxy(wrappedHandler, {
    apply(target, thisArg, args) {
      if (args.length === 0) {
        // Called without arguments in tests - create a mock request
        return target.call(thisArg, new NextRequest("http://localhost/test"));
      }
      return target.apply(thisArg, args as [NextRequest]);
    },
  });
}
