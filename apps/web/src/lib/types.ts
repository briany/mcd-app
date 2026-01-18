export type CouponStatus = "active" | "expired" | "redeemed" | "unknown" | string;

export interface Coupon {
  id: string;
  name: string;
  imageUrl?: string | null;
  expiryDate: string; // yyyy-MM-dd from MCP
  status: CouponStatus;
}

export interface CouponListResponse {
  coupons: Coupon[];
  total: number;
  page: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  isSubscribed: boolean;
}

export type CampaignStatus = "ongoing" | "past" | "upcoming" | "unknown";

export interface CampaignListResponse {
  campaigns: Campaign[];
  date: string; // yyyy-MM-dd
}

export interface AutoClaimResponse {
  success: boolean;
  claimed: number;
  message: string;
}

export interface TimeInfo {
  timestamp: number;
  formatted: string;
  year: number;
  month: number;
  day: number;
}

export interface MCPErrorPayload {
  code: number;
  message: string;
}

export type AvailableCoupon = Coupon;
