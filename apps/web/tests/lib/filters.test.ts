import { describe, it, expect } from "vitest";
import { matchesFilter } from "@/lib/filters";
import type { Coupon } from "@/lib/types";

const createCoupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  id: "test-coupon",
  name: "Test Coupon",
  imageUrl: null,
  expiryDate: "2026-12-31",
  status: "active",
  ...overrides,
});

describe("matchesFilter", () => {
  describe("status filtering", () => {
    it("matches all coupons when status is 'all'", () => {
      const activeCoupon = createCoupon({ status: "active" });
      const expiredCoupon = createCoupon({ status: "expired" });
      const unknownCoupon = createCoupon({ status: "unknown" });

      expect(matchesFilter(activeCoupon, "all", "")).toBe(true);
      expect(matchesFilter(expiredCoupon, "all", "")).toBe(true);
      expect(matchesFilter(unknownCoupon, "all", "")).toBe(true);
    });

    it("matches active coupons when status is 'active'", () => {
      const activeCoupon = createCoupon({ status: "active" });
      expect(matchesFilter(activeCoupon, "active", "")).toBe(true);
    });

    it("filters out expired coupons when status is 'active'", () => {
      const expiredCoupon = createCoupon({ status: "expired" });
      // Note: "expiring soon" contains "expire" so it's treated as expired
      const willExpireCoupon = createCoupon({ status: "will expire next week" });

      expect(matchesFilter(expiredCoupon, "active", "")).toBe(false);
      expect(matchesFilter(willExpireCoupon, "active", "")).toBe(false);
    });

    it("matches expired coupons when status is 'expired'", () => {
      const expiredCoupon = createCoupon({ status: "expired" });
      const expiringCoupon = createCoupon({ status: "expires today" });

      expect(matchesFilter(expiredCoupon, "expired", "")).toBe(true);
      expect(matchesFilter(expiringCoupon, "expired", "")).toBe(true);
    });

    it("filters out active coupons when status is 'expired'", () => {
      const activeCoupon = createCoupon({ status: "active" });
      expect(matchesFilter(activeCoupon, "expired", "")).toBe(false);
    });

    it("handles case-insensitive status matching", () => {
      const expiredCoupon = createCoupon({ status: "EXPIRED" });
      const expiringCoupon = createCoupon({ status: "Expire Soon" });

      expect(matchesFilter(expiredCoupon, "expired", "")).toBe(true);
      expect(matchesFilter(expiringCoupon, "expired", "")).toBe(true);
    });

    it("matches non-expired coupons as active", () => {
      const redeemedCoupon = createCoupon({ status: "redeemed" });
      const pendingCoupon = createCoupon({ status: "pending" });
      const unknownCoupon = createCoupon({ status: "unknown" });

      expect(matchesFilter(redeemedCoupon, "active", "")).toBe(true);
      expect(matchesFilter(pendingCoupon, "active", "")).toBe(true);
      expect(matchesFilter(unknownCoupon, "active", "")).toBe(true);
    });
  });

  describe("query filtering", () => {
    it("matches all coupons when query is empty", () => {
      const coupon = createCoupon({ name: "Test Coupon" });
      expect(matchesFilter(coupon, "all", "")).toBe(true);
    });

    it("matches all coupons when query is whitespace", () => {
      const coupon = createCoupon({ name: "Test Coupon" });
      expect(matchesFilter(coupon, "all", "   ")).toBe(true);
      expect(matchesFilter(coupon, "all", "\t\n")).toBe(true);
    });

    it("matches coupon name (case-insensitive)", () => {
      const coupon = createCoupon({ name: "Breakfast Special" });

      expect(matchesFilter(coupon, "all", "breakfast")).toBe(true);
      expect(matchesFilter(coupon, "all", "BREAKFAST")).toBe(true);
      expect(matchesFilter(coupon, "all", "BrEaKfAsT")).toBe(true);
    });

    it("matches partial coupon name", () => {
      const coupon = createCoupon({ name: "Breakfast Special" });

      expect(matchesFilter(coupon, "all", "break")).toBe(true);
      expect(matchesFilter(coupon, "all", "special")).toBe(true);
      expect(matchesFilter(coupon, "all", "fast")).toBe(true);
    });

    it("matches coupon status (case-insensitive)", () => {
      const coupon = createCoupon({ status: "Active" });

      expect(matchesFilter(coupon, "all", "active")).toBe(true);
      expect(matchesFilter(coupon, "all", "ACTIVE")).toBe(true);
      expect(matchesFilter(coupon, "all", "tive")).toBe(true);
    });

    it("filters out non-matching coupons", () => {
      const coupon = createCoupon({ name: "Breakfast Special", status: "active" });

      expect(matchesFilter(coupon, "all", "lunch")).toBe(false);
      expect(matchesFilter(coupon, "all", "expired")).toBe(false);
      expect(matchesFilter(coupon, "all", "xyz")).toBe(false);
    });

    it("trims whitespace from query", () => {
      const coupon = createCoupon({ name: "Breakfast Special" });

      expect(matchesFilter(coupon, "all", "  breakfast  ")).toBe(true);
      expect(matchesFilter(coupon, "all", "\tspecial\n")).toBe(true);
    });
  });

  describe("combined filtering", () => {
    it("applies both status and query filters", () => {
      const activeCoupon = createCoupon({ name: "Breakfast Deal", status: "active" });
      const expiredCoupon = createCoupon({ name: "Lunch Deal", status: "expired" });

      // Status: active, Query: breakfast
      expect(matchesFilter(activeCoupon, "active", "breakfast")).toBe(true);
      expect(matchesFilter(expiredCoupon, "active", "breakfast")).toBe(false);

      // Status: expired, Query: lunch
      expect(matchesFilter(activeCoupon, "expired", "lunch")).toBe(false);
      expect(matchesFilter(expiredCoupon, "expired", "lunch")).toBe(true);
    });

    it("requires both filters to match", () => {
      const coupon = createCoupon({ name: "Breakfast Special", status: "active" });

      // Matches status but not query
      expect(matchesFilter(coupon, "active", "lunch")).toBe(false);

      // Matches query but not status
      expect(matchesFilter(coupon, "expired", "breakfast")).toBe(false);

      // Matches both
      expect(matchesFilter(coupon, "active", "breakfast")).toBe(true);
    });

    it("allows 'all' status with any query", () => {
      const activeCoupon = createCoupon({ name: "Breakfast Deal", status: "active" });
      const expiredCoupon = createCoupon({ name: "Lunch Deal", status: "expired" });

      expect(matchesFilter(activeCoupon, "all", "breakfast")).toBe(true);
      expect(matchesFilter(expiredCoupon, "all", "lunch")).toBe(true);
      expect(matchesFilter(activeCoupon, "all", "lunch")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles empty coupon name", () => {
      const coupon = createCoupon({ name: "" });

      expect(matchesFilter(coupon, "all", "")).toBe(true);
      expect(matchesFilter(coupon, "all", "test")).toBe(false);
    });

    it("handles special characters in query", () => {
      const coupon = createCoupon({ name: "Buy 1 Get 1 Free!" });

      expect(matchesFilter(coupon, "all", "buy 1")).toBe(true);
      expect(matchesFilter(coupon, "all", "free!")).toBe(true);
      expect(matchesFilter(coupon, "all", "1")).toBe(true);
    });

    it("handles unicode characters", () => {
      const coupon = createCoupon({ name: "Café Breakfast ☕" });

      expect(matchesFilter(coupon, "all", "café")).toBe(true);
      expect(matchesFilter(coupon, "all", "☕")).toBe(true);
    });

    it("matches query in either name or status", () => {
      const coupon = createCoupon({ name: "Lunch Special", status: "breakfast-only" });

      // Query matches status field
      expect(matchesFilter(coupon, "all", "breakfast")).toBe(true);

      // Query matches name field
      expect(matchesFilter(coupon, "all", "lunch")).toBe(true);
    });
  });
});
