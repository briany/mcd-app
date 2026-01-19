import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { statusColor, humanizeExpiry } from "@/lib/couponUtils";

describe("statusColor", () => {
  it("returns rose color for expired status", () => {
    expect(statusColor("expired")).toBe("text-rose-600");
    expect(statusColor("Expired")).toBe("text-rose-600");
    expect(statusColor("EXPIRED")).toBe("text-rose-600");
  });

  it("returns rose color for status containing 'expire'", () => {
    expect(statusColor("will expire soon")).toBe("text-rose-600");
    expect(statusColor("expires today")).toBe("text-rose-600");
  });

  it("returns emerald color for active status", () => {
    expect(statusColor("active")).toBe("text-emerald-600");
    expect(statusColor("Active")).toBe("text-emerald-600");
    expect(statusColor("ACTIVE")).toBe("text-emerald-600");
  });

  it("returns emerald color for status containing 'active'", () => {
    expect(statusColor("currently active")).toBe("text-emerald-600");
    expect(statusColor("is active")).toBe("text-emerald-600");
  });

  it("returns slate color for unknown status", () => {
    expect(statusColor("unknown")).toBe("text-slate-500");
    expect(statusColor("pending")).toBe("text-slate-500");
    expect(statusColor("redeemed")).toBe("text-slate-500");
  });

  it("returns slate color for empty string", () => {
    expect(statusColor("")).toBe("text-slate-500");
  });

  it("prioritizes 'expire' over 'active' when both present", () => {
    // Since 'expire' check comes first, it should return rose
    expect(statusColor("active but will expire")).toBe("text-rose-600");
  });
});

describe("humanizeExpiry", () => {
  beforeEach(() => {
    // Mock current date to 2026-01-19 00:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-19T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Unknown expiry' for invalid date", () => {
    expect(humanizeExpiry("invalid-date")).toBe("Unknown expiry");
    expect(humanizeExpiry("")).toBe("Unknown expiry");
    expect(humanizeExpiry("not-a-date")).toBe("Unknown expiry");
  });

  it("returns 'Expires today' for same day", () => {
    expect(humanizeExpiry("2026-01-19")).toBe("Expires today");
  });

  it("returns 'Expires in Xd' for future dates", () => {
    expect(humanizeExpiry("2026-01-20")).toBe("Expires in 1d");
    expect(humanizeExpiry("2026-01-21")).toBe("Expires in 2d");
    expect(humanizeExpiry("2026-01-26")).toBe("Expires in 7d");
    expect(humanizeExpiry("2026-02-19")).toBe("Expires in 31d");
  });

  it("returns 'Expired Xd ago' for past dates", () => {
    expect(humanizeExpiry("2026-01-18")).toBe("Expired 1d ago");
    expect(humanizeExpiry("2026-01-17")).toBe("Expired 2d ago");
    expect(humanizeExpiry("2026-01-12")).toBe("Expired 7d ago");
    expect(humanizeExpiry("2025-12-19")).toBe("Expired 31d ago");
  });

  it("handles far future dates", () => {
    expect(humanizeExpiry("2027-01-19")).toBe("Expires in 365d");
    expect(humanizeExpiry("2030-01-19")).toBe("Expires in 1461d");
  });

  it("handles far past dates", () => {
    expect(humanizeExpiry("2025-01-19")).toBe("Expired 365d ago");
    expect(humanizeExpiry("2024-01-19")).toBe("Expired 731d ago");
  });

  it("handles dates with time components", () => {
    // When comparing dates with time, the time component affects the calculation
    // 2026-01-19T23:59:59 is 1 day ahead of 2026-01-19T00:00:00
    expect(humanizeExpiry("2026-01-20T00:00:00")).toBe("Expires in 1d");
  });

  it("uses Math.ceil for day calculation", () => {
    // Math.ceil rounds up the day count
    // From 2026-01-19 00:00:00 to 2026-01-20 00:00:00 is exactly 1 day
    expect(humanizeExpiry("2026-01-20T00:00:00")).toBe("Expires in 1d");
    // Anything beyond that rounds up to 2 days
    expect(humanizeExpiry("2026-01-20T12:00:00")).toBe("Expires in 2d");
  });
});
