import { describe, it, expect } from "vitest";
import {
  dateSchema,
  couponIdSchema,
  campaignQuerySchema,
  claimCouponSchema,
  paginationSchema,
  validateBody,
  validateQuery,
} from "@/lib/validation";

describe("validation schemas", () => {
  describe("dateSchema", () => {
    it("accepts valid date format yyyy-MM-dd", () => {
      expect(() => dateSchema.parse("2026-01-20")).not.toThrow();
    });

    it("rejects invalid date format", () => {
      expect(() => dateSchema.parse("01-20-2026")).toThrow();
      expect(() => dateSchema.parse("2026/01/20")).toThrow();
    });

    it("rejects invalid date values", () => {
      expect(() => dateSchema.parse("2026-13-01")).toThrow();
      expect(() => dateSchema.parse("2026-01-32")).toThrow();
    });
  });

  describe("couponIdSchema", () => {
    it("accepts valid coupon ID", () => {
      expect(() => couponIdSchema.parse("coupon-123")).not.toThrow();
      expect(() => couponIdSchema.parse("COUPON_ABC_456")).not.toThrow();
    });

    it("rejects empty coupon ID", () => {
      expect(() => couponIdSchema.parse("")).toThrow();
    });

    it("rejects coupon ID with invalid characters", () => {
      expect(() => couponIdSchema.parse("coupon@123")).toThrow();
      expect(() => couponIdSchema.parse("coupon 123")).toThrow();
    });

    it("rejects too long coupon ID", () => {
      expect(() => couponIdSchema.parse("a".repeat(101))).toThrow();
    });
  });

  describe("paginationSchema", () => {
    it("parses valid pagination params", () => {
      const result = paginationSchema.parse({ page: "2", pageSize: "50" });
      expect(result).toEqual({ page: 2, pageSize: 50 });
    });

    it("uses defaults when not provided", () => {
      const result = paginationSchema.parse({});
      expect(result).toEqual({ page: 1, pageSize: 20 });
    });

    it("rejects invalid page numbers", () => {
      expect(() => paginationSchema.parse({ page: "0" })).toThrow();
      expect(() => paginationSchema.parse({ page: "101" })).toThrow();
    });

    it("rejects invalid page size", () => {
      expect(() => paginationSchema.parse({ pageSize: "0" })).toThrow();
      expect(() => paginationSchema.parse({ pageSize: "201" })).toThrow();
    });
  });

  describe("validateBody", () => {
    it("returns data when body is valid", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ couponId: "test-123" }),
      });

      const result = await validateBody(request, claimCouponSchema);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ couponId: "test-123" });
    });

    it("returns error when body is invalid", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ couponId: "" }),
      });

      const result = await validateBody(request, claimCouponSchema);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe("validateQuery", () => {
    it("returns data when query params are valid", () => {
      const params = new URLSearchParams("date=2026-01-20");

      const result = validateQuery(params, campaignQuerySchema);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ date: "2026-01-20" });
    });

    it("returns error when query params are invalid", () => {
      const params = new URLSearchParams("date=invalid");

      const result = validateQuery(params, campaignQuerySchema);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });
});
