import { describe, it, expect } from "vitest";
import { getRateLimitIdentifier } from "@/lib/ratelimit";

describe("ratelimit", () => {
  describe("getRateLimitIdentifier", () => {
    it("returns user ID when provided", () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      const identifier = getRateLimitIdentifier(mockRequest, "user-123");

      expect(identifier).toBe("user:user-123");
    });

    it("returns IP from x-forwarded-for when no user ID", () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("returns IP from x-real-ip when x-forwarded-for not present", () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-real-ip": "192.168.1.2" },
      });

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.2");
    });

    it("returns unknown when no IP headers present", () => {
      const mockRequest = new Request("http://localhost");

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:unknown");
    });
  });
});
