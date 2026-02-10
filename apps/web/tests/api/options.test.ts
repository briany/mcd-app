import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
  allowedOrigins: ["http://localhost:3000"],
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

vi.mock("@/lib/withCsrf", () => ({
  withCsrf: vi.fn((handler) => handler),
}));

vi.mock("@/lib/withRateLimit", () => ({
  withRateLimit: vi.fn((handler) => handler),
}));

vi.mock("@/lib/withBodySizeLimit", () => ({
  withBodySizeLimit: vi.fn((handler) => handler),
}));

import * as campaignsRoute from "@/app/api/campaigns/route";
import * as couponsRoute from "@/app/api/coupons/route";
import * as availableCouponsRoute from "@/app/api/available-coupons/route";
import * as autoClaimRoute from "@/app/api/available-coupons/auto-claim/route";
import * as claimRoute from "@/app/api/coupons/claim/route";
import * as logoutRoute from "@/app/api/auth/logout/route";

describe("API CORS preflight (OPTIONS)", () => {
  const createRequest = (origin = "http://localhost:3000") =>
    new NextRequest("http://localhost:3000/api/test", {
      method: "OPTIONS",
      headers: { origin },
    });

  const routes = [
    { name: "/api/campaigns", module: campaignsRoute },
    { name: "/api/coupons", module: couponsRoute },
    { name: "/api/available-coupons", module: availableCouponsRoute },
    { name: "/api/available-coupons/auto-claim", module: autoClaimRoute },
    { name: "/api/coupons/claim", module: claimRoute },
    { name: "/api/auth/logout", module: logoutRoute },
  ];

  for (const route of routes) {
    it(`${route.name} exposes OPTIONS handler with CORS headers`, async () => {
      expect(typeof route.module.OPTIONS).toBe("function");

      const response = await route.module.OPTIONS(createRequest());

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000"
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
        "X-CSRF-Token"
      );
      expect(response.headers.get("Vary")).toContain("Origin");
    });
  }
});
