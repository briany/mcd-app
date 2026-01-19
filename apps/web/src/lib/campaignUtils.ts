import type { Campaign, CampaignStatus } from "@/lib/types";

/**
 * Utility functions for campaign display and formatting
 */

/**
 * Formats a date string to a localized short date format (e.g., "Jan 15")
 */
export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

/**
 * Determines the status of a campaign based on current date and campaign dates
 */
export const getStatus = (campaign: Campaign): CampaignStatus => {
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "unknown";
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
};

/**
 * Style classes for campaign status badges
 */
export const statusStyles: Record<CampaignStatus, string> = {
  upcoming: "bg-sky-100 text-sky-700",
  ongoing: "bg-emerald-100 text-emerald-700",
  past: "bg-slate-100 text-slate-600",
  unknown: "bg-slate-100 text-slate-600",
};
