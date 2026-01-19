import type { Coupon } from "@/lib/types";

/**
 * Utility functions for filtering coupons
 */

/**
 * Determines if a coupon matches the given status and query filters
 *
 * @param coupon - The coupon to check
 * @param status - Status filter: "all", "active", or "expired"
 * @param query - Search query string (case-insensitive, partial match)
 * @returns true if the coupon matches all filters
 */
export const matchesFilter = (coupon: Coupon, status: string, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesStatus =
    status === "all" ||
    (status === "active" && !coupon.status.toLowerCase().includes("expire")) ||
    (status === "expired" && coupon.status.toLowerCase().includes("expire"));

  const matchesQuery =
    !normalizedQuery ||
    coupon.name.toLowerCase().includes(normalizedQuery) ||
    coupon.status.toLowerCase().includes(normalizedQuery);

  return matchesStatus && matchesQuery;
};
