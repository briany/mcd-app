import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatDate, getStatus, statusStyles } from "@/lib/campaignUtils";
import type { Campaign } from "@/lib/types";

describe("formatDate", () => {
  it("formats valid dates to short month and day", () => {
    expect(formatDate("2026-01-19")).toBe("Jan 19");
    expect(formatDate("2026-12-25")).toBe("Dec 25");
    expect(formatDate("2026-07-04")).toBe("Jul 4");
  });

  it("handles dates with time components", () => {
    // Date formatting depends on local timezone
    // Using UTC dates to ensure consistent formatting
    expect(formatDate("2026-01-19T00:00:00Z")).toContain("Jan");
    expect(formatDate("2026-01-19T23:59:59Z")).toContain("Jan");
  });

  it("formats ISO date strings", () => {
    // Timezone-safe assertion
    expect(formatDate("2026-03-15T00:00:00.000Z")).toContain("Mar");
  });

  it("handles invalid dates", () => {
    // Invalid dates return "Invalid Date" when formatted
    const result = formatDate("invalid-date");
    expect(result).toBe("Invalid Date");
  });

  it("handles edge case dates", () => {
    expect(formatDate("2026-01-01")).toBe("Jan 1");
    expect(formatDate("2026-12-31")).toBe("Dec 31");
  });
});

describe("getStatus", () => {
  beforeEach(() => {
    // Mock current date to 2026-01-19 12:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-19T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'upcoming' when current date is before start date", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Future Campaign",
      description: "Coming soon",
      startDate: "2026-01-20",
      endDate: "2026-01-25",
      isSubscribed: false,
    };
    expect(getStatus(campaign)).toBe("upcoming");
  });

  it("returns 'ongoing' when current date is between start and end", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Current Campaign",
      description: "Happening now",
      startDate: "2026-01-15",
      endDate: "2026-01-25",
      isSubscribed: false,
    };
    expect(getStatus(campaign)).toBe("ongoing");
  });

  it("returns 'ongoing' when current date equals start date", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Starting Today",
      description: "Just started",
      startDate: "2026-01-19",
      endDate: "2026-01-25",
      isSubscribed: false,
    };
    expect(getStatus(campaign)).toBe("ongoing");
  });

  it("returns 'past' when current date is after end date", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Past Campaign",
      description: "Already ended",
      startDate: "2026-01-10",
      endDate: "2026-01-18",
      isSubscribed: false,
    };
    expect(getStatus(campaign)).toBe("past");
  });

  it("returns 'past' when current date equals end date", () => {
    // Since the check is now > end, equal should return ongoing or past
    // Looking at the code: if (now > end) return "past"; else return "ongoing"
    const campaign: Campaign = {
      id: "1",
      title: "Ending Today",
      description: "Last day",
      startDate: "2026-01-15",
      endDate: "2026-01-19",
      isSubscribed: false,
    };
    // Based on the logic, now (12:00) > end (00:00) so it should be past
    expect(getStatus(campaign)).toBe("past");
  });

  it("returns 'unknown' when start date is invalid", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Invalid Campaign",
      description: "Bad dates",
      startDate: "invalid-date",
      endDate: "2026-01-25",
      isSubscribed: false,
    };
    expect(getStatus(campaign)).toBe("unknown");
  });

  it("returns 'unknown' when end date is invalid", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Invalid Campaign",
      description: "Bad dates",
      startDate: "2026-01-15",
      endDate: "invalid-date",
      isSubscribed: false,
    };
    expect(getStatus(campaign)).toBe("unknown");
  });

  it("returns 'unknown' when both dates are invalid", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Invalid Campaign",
      description: "Bad dates",
      startDate: "invalid-date",
      endDate: "also-invalid",
      isSubscribed: false,
    };
    expect(getStatus(campaign)).toBe("unknown");
  });

  it("handles campaigns with time components in dates", () => {
    const campaign: Campaign = {
      id: "1",
      title: "Precise Campaign",
      description: "With times",
      startDate: "2026-01-19T00:00:00Z",
      endDate: "2026-01-19T23:59:59Z",
      isSubscribed: false,
    };
    // Current time is 12:00, so it's between start (00:00) and end (23:59)
    expect(getStatus(campaign)).toBe("ongoing");
  });
});

describe("statusStyles", () => {
  it("has styles for all status types", () => {
    expect(statusStyles.upcoming).toBe("bg-sky-100 text-sky-700");
    expect(statusStyles.ongoing).toBe("bg-emerald-100 text-emerald-700");
    expect(statusStyles.past).toBe("bg-slate-100 text-slate-600");
    expect(statusStyles.unknown).toBe("bg-slate-100 text-slate-600");
  });

  it("has all required status keys", () => {
    expect(Object.keys(statusStyles)).toEqual(
      expect.arrayContaining(["upcoming", "ongoing", "past", "unknown"])
    );
  });
});
