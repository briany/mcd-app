import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockState = vi.hoisted(() => ({
  apiLimit: vi.fn(async () => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  })),
  writeLimit: vi.fn(async () => ({
    success: false,
    limit: 10,
    remaining: 0,
    reset: Date.now() + 60000,
  })),
  autoClaimLimit: vi.fn(async () => ({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now() + 60000,
  })),
  getRateLimitIdentifier: vi.fn((_: Request, userId?: string) =>
    userId ? `user:${userId}` : "ip:127.0.0.1"
  ),
  getToken: vi.fn(async () => null),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: mockState.getToken,
}));

// Mock the ratelimit module
vi.mock("@/lib/ratelimit", () => ({
  rateLimiters: {
    api: {
      limit: mockState.apiLimit,
    },
    write: {
      limit: mockState.writeLimit,
    },
    autoClaim: {
      limit: mockState.autoClaimLimit,
    },
  },
  getRateLimitIdentifier: mockState.getRateLimitIdentifier,
}));

import { withRateLimit } from "@/lib/withRateLimit";
import { getToken } from "next-auth/jwt";
import { getRateLimitIdentifier } from "@/lib/ratelimit";

describe("withRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("prefers authenticated user identity when available", async () => {
    vi.mocked(getToken).mockResolvedValueOnce({ id: "user-123" });
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "api");
    const request = new NextRequest("http://localhost/api/test");

    const response = await wrappedHandler(request);

    expect(response.status).toBe(200);
    expect(getRateLimitIdentifier).toHaveBeenCalledWith(request, "user-123");
    expect(mockState.apiLimit).toHaveBeenCalledWith("user:user-123");
  });

  it("falls back safely when user identity cannot be resolved", async () => {
    vi.mocked(getToken).mockRejectedValueOnce(new Error("JWT parse failed"));
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "api");
    const request = new NextRequest("http://localhost/api/test");

    const response = await wrappedHandler(request);

    expect(response.status).toBe(200);
    expect(getRateLimitIdentifier).toHaveBeenCalledWith(request, undefined);
    expect(mockState.apiLimit).toHaveBeenCalledWith("ip:127.0.0.1");
  });

  it("returns 503 when rate limiter backend/config fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockState.apiLimit.mockRejectedValueOnce(new Error("Rate limiter backend unavailable"));

    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "api");
    const request = new NextRequest("http://localhost/api/test");

    const response = await wrappedHandler(request);
    const body = await response.json();

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    expect(body).toEqual({ message: "Service temporarily unavailable" });

    consoleErrorSpy.mockRestore();
  });
});
