import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadRatelimitModule() {
  vi.resetModules();
  return import("@/lib/ratelimit");
}

describe("ratelimit", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("rateLimiters configuration", () => {
    it("fails closed in production when Redis is not configured", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { rateLimiters } = await loadRatelimitModule();

      await expect(rateLimiters.api.limit("ip:127.0.0.1")).rejects.toThrow(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured in production"
      );
    });

    it("keeps permissive in-memory fallback in non-production", async () => {
      process.env.NODE_ENV = "test";
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { rateLimiters } = await loadRatelimitModule();
      const result = await rateLimiters.api.limit("ip:127.0.0.1");

      expect(result.success).toBe(true);
    });
  });

  describe("getRateLimitIdentifier", () => {
    it("returns user ID when provided", async () => {
      const { getRateLimitIdentifier } = await loadRatelimitModule();
      const mockRequest = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      const identifier = getRateLimitIdentifier(mockRequest, "user-123");

      expect(identifier).toBe("user:user-123");
    });

    it("returns IP from x-forwarded-for when no user ID", async () => {
      const { getRateLimitIdentifier } = await loadRatelimitModule();
      const mockRequest = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("returns IP from x-real-ip when x-forwarded-for not present", async () => {
      const { getRateLimitIdentifier } = await loadRatelimitModule();
      const mockRequest = new Request("http://localhost", {
        headers: { "x-real-ip": "192.168.1.2" },
      });

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.2");
    });

    it("returns unknown when no IP headers present", async () => {
      const { getRateLimitIdentifier } = await loadRatelimitModule();
      const mockRequest = new Request("http://localhost");

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:unknown");
    });

    it("trims forwarded IP value safely", async () => {
      const { getRateLimitIdentifier } = await loadRatelimitModule();
      const mockRequest = new Request("http://localhost", {
        headers: { "x-forwarded-for": "   192.168.1.50   , 10.0.0.1" },
      });

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.50");
    });
  });
});
