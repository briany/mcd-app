import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * These tests verify caching configuration by reading the source files directly.
 * This is a valid integration test approach that ensures the actual code contains
 * the expected caching values without relying on runtime introspection.
 */

const HOOKS_DIR = path.join(__dirname, "../../src/hooks");

describe("Caching Configuration - Source Verification", () => {
  describe("useCoupons", () => {
    const hookSource = fs.readFileSync(
      path.join(HOOKS_DIR, "useCoupons.ts"),
      "utf-8"
    );

    it("should have staleTime of 1 minute (60000ms)", () => {
      // staleTime: 1000 * 60 = 60000ms = 1 minute
      expect(hookSource).toContain("staleTime: 1000 * 60");
    });

    it("should have gcTime of 5 minutes (300000ms)", () => {
      // gcTime: 1000 * 60 * 5 = 300000ms = 5 minutes
      expect(hookSource).toContain("gcTime: 1000 * 60 * 5");
    });

    it("should refetch on mount", () => {
      expect(hookSource).toContain('refetchOnMount: "always"');
    });

    it("should refetch on window focus", () => {
      expect(hookSource).toContain("refetchOnWindowFocus: true");
    });
  });

  describe("useAvailableCoupons", () => {
    const hookSource = fs.readFileSync(
      path.join(HOOKS_DIR, "useAvailableCoupons.ts"),
      "utf-8"
    );

    it("should have staleTime of 1 minute (60000ms)", () => {
      // staleTime: 1000 * 60 = 60000ms = 1 minute
      expect(hookSource).toContain("staleTime: 1000 * 60");
    });

    it("should have gcTime of 5 minutes (300000ms)", () => {
      // gcTime: 1000 * 60 * 5 = 300000ms = 5 minutes
      expect(hookSource).toContain("gcTime: 1000 * 60 * 5");
    });

    it("should refetch on mount", () => {
      expect(hookSource).toContain('refetchOnMount: "always"');
    });

    it("should refetch on window focus", () => {
      expect(hookSource).toContain("refetchOnWindowFocus: true");
    });
  });

  describe("useCampaigns", () => {
    const hookSource = fs.readFileSync(
      path.join(HOOKS_DIR, "useCampaigns.ts"),
      "utf-8"
    );

    it("should have staleTime of 5 minutes (300000ms) matching API revalidate", () => {
      // staleTime: 1000 * 60 * 5 = 300000ms = 5 minutes
      // This matches the API route's revalidate = 300 (seconds)
      expect(hookSource).toContain("staleTime: 1000 * 60 * 5");
    });

    it("should have gcTime of 10 minutes (600000ms)", () => {
      // gcTime: 1000 * 60 * 10 = 600000ms = 10 minutes
      // Double the staleTime as done in other hooks
      expect(hookSource).toContain("gcTime: 1000 * 60 * 10");
    });

    it("should refetch on mount", () => {
      expect(hookSource).toContain('refetchOnMount: "always"');
    });

    it("should refetch on window focus", () => {
      expect(hookSource).toContain("refetchOnWindowFocus: true");
    });
  });
});

describe("API Route Caching - Source Verification", () => {
  const ROUTES_DIR = path.join(__dirname, "../../src/app/api");

  describe("campaigns API route", () => {
    const routeSource = fs.readFileSync(
      path.join(ROUTES_DIR, "campaigns/route.ts"),
      "utf-8"
    );

    it("should have revalidate of 300 seconds (5 minutes)", () => {
      expect(routeSource).toContain("revalidate = 300");
    });
  });
});
