import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the ratelimit module
vi.mock("@/lib/ratelimit", () => ({
  rateLimiters: {
    api: {
      limit: vi.fn(async () => ({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      })),
    },
    write: {
      limit: vi.fn(async () => ({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      })),
    },
  },
  getRateLimitIdentifier: vi.fn(() => "ip:127.0.0.1"),
}));

import { withRateLimit } from "@/lib/withRateLimit";
import { rateLimiters } from "@/lib/ratelimit";

describe("withRateLimit", () => {
  it("allows request when rate limit not exceeded", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "api");

    const request = new NextRequest("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
  });

  it("blocks request when rate limit exceeded", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "write");

    const request = new NextRequest("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.message).toContain("Too many requests");
  });

  it("includes rate limit headers in response", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "api");

    const request = new NextRequest("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(response.headers.has("X-RateLimit-Limit")).toBe(true);
    expect(response.headers.has("X-RateLimit-Remaining")).toBe(true);
    expect(response.headers.has("X-RateLimit-Reset")).toBe(true);
  });
});
