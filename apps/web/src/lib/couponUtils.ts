/**
 * Utility functions for coupon display and formatting
 */

/**
 * Returns a color class based on coupon status
 */
export const statusColor = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("expire")) return "text-rose-600";
  if (normalized.includes("active")) return "text-emerald-600";
  return "text-slate-500";
};

/**
 * Converts an expiry date to a human-readable relative time string
 */
export const humanizeExpiry = (expiryDate: string): string => {
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return "Unknown expiry";
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days}d`;
};
