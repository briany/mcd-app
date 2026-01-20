import { describe, it, expect, vi } from "vitest";

// Mock dependencies before importing routes
vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
}));

vi.mock("@/lib/authHelpers", () => ({
  requireAuth: vi.fn(() =>
    Promise.resolve({
      error: null,
      session: { user: { id: "1", name: "Test User" } },
    })
  ),
}));

vi.mock("@/lib/mcpClient", () => ({
  mcpClient: {
    getCampaigns: vi.fn(),
    getCoupons: vi.fn(),
    getAvailableCoupons: vi.fn(),
    autoClaimCoupons: vi.fn(),
  },
}));

vi.mock("@/lib/csrf", () => ({
  generateCsrfToken: vi.fn(() => "test-csrf-token"),
  verifyCsrfToken: vi.fn(() => true),
}));

vi.mock("@/lib/withCsrf", () => ({
  withCsrf: vi.fn((handler) => handler),
}));

vi.mock("@/lib/withRateLimit", () => ({
  withRateLimit: vi.fn((handler) => handler),
}));

vi.mock("@/lib/withBodySizeLimit", () => ({
  withBodySizeLimit: vi.fn((handler) => handler),
}));

// Import revalidate exports from API routes
import * as campaignsRoute from "@/app/api/campaigns/route";
import * as couponsRoute from "@/app/api/coupons/route";
import * as availableCouponsRoute from "@/app/api/available-coupons/route";
import * as autoClaimRoute from "@/app/api/available-coupons/auto-claim/route";
import * as claimRoute from "@/app/api/coupons/claim/route";

describe("API Route Caching Configuration", () => {
  describe("GET routes (should be cached)", () => {
    it("campaigns route should cache for 5 minutes", () => {
      expect(campaignsRoute.revalidate).toBe(300);
    });

    it("coupons route should cache for 1 minute", () => {
      expect(couponsRoute.revalidate).toBe(60);
    });

    it("available-coupons route should cache for 1 minute", () => {
      expect(availableCouponsRoute.revalidate).toBe(60);
    });
  });

  describe("POST routes (should not be cached)", () => {
    it("auto-claim route should have no cache or revalidate=0", () => {
      // POST routes either have no revalidate export or revalidate=0
      const revalidateValue = (autoClaimRoute as { revalidate?: number }).revalidate;
      expect(revalidateValue === undefined || revalidateValue === 0).toBe(true);
    });

    it("claim route should have no cache or revalidate=0", () => {
      // POST routes either have no revalidate export or revalidate=0
      const revalidateValue = (claimRoute as { revalidate?: number }).revalidate;
      expect(revalidateValue === undefined || revalidateValue === 0).toBe(true);
    });
  });
});
