import type {
  Coupon,
  CouponListResponse,
  Campaign,
  CampaignListResponse,
  AutoClaimResponse,
  TimeInfo,
  MCPErrorPayload,
} from "@/lib/types";
import { McpClientError } from "@/lib/mcpClient";

/**
 * Mock data fixtures for testing
 */
export const mockCoupon: Coupon = {
  id: "coupon-123",
  name: "Test Coupon",
  imageUrl: "https://example.com/coupon.jpg",
  expiryDate: "2026-12-31",
  status: "active",
};

export const mockExpiredCoupon: Coupon = {
  id: "coupon-expired",
  name: "Expired Coupon",
  imageUrl: null,
  expiryDate: "2025-01-01",
  status: "expired",
};

export const mockCouponListResponse: CouponListResponse = {
  coupons: [mockCoupon],
  total: 1,
  page: 1,
};

export const mockCampaign: Campaign = {
  id: "campaign-123",
  title: "Test Campaign",
  description: "A test campaign description",
  imageUrl: "https://example.com/campaign.jpg",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  isSubscribed: false,
};

export const mockCampaignListResponse: CampaignListResponse = {
  campaigns: [mockCampaign],
  date: "2026-01-19",
};

export const mockAutoClaimResponse: AutoClaimResponse = {
  success: true,
  claimed: 5,
  message: "Successfully claimed 5 coupons",
};

export const mockTimeInfo: TimeInfo = {
  timestamp: 1737302400000, // 2026-01-19
  formatted: "2026-01-19T00:00:00Z",
  year: 2026,
  month: 1,
  day: 19,
};

export const mockMCPErrorPayload: MCPErrorPayload = {
  code: 404,
  message: "Resource not found",
};

/**
 * Creates a mock MCP client with configurable responses
 */
export const createMockMcpClient = (overrides?: {
  getCoupons?: () => Promise<CouponListResponse>;
  getAvailableCoupons?: () => Promise<CouponListResponse>;
  getCampaigns?: (date?: string) => Promise<CampaignListResponse>;
  autoClaimCoupons?: () => Promise<AutoClaimResponse>;
  claimCoupon?: (couponId: string) => Promise<AutoClaimResponse>;
  getTimeInfo?: () => Promise<TimeInfo>;
}) => ({
  getCoupons: overrides?.getCoupons ?? (() => Promise.resolve(mockCouponListResponse)),
  getAvailableCoupons:
    overrides?.getAvailableCoupons ?? (() => Promise.resolve(mockCouponListResponse)),
  getCampaigns: overrides?.getCampaigns ?? (() => Promise.resolve(mockCampaignListResponse)),
  autoClaimCoupons: overrides?.autoClaimCoupons ?? (() => Promise.resolve(mockAutoClaimResponse)),
  claimCoupon: overrides?.claimCoupon ?? (() => Promise.resolve(mockAutoClaimResponse)),
  getTimeInfo: overrides?.getTimeInfo ?? (() => Promise.resolve(mockTimeInfo)),
});

/**
 * Error simulation helpers
 */
export const createMcpClientError = (
  message: string,
  status: number,
  details?: MCPErrorPayload
): McpClientError => {
  return new McpClientError(message, status, details);
};

export const mock404Error = (): McpClientError => {
  return createMcpClientError("Not found", 404, {
    code: 404,
    message: "Resource not found",
  });
};

export const mock500Error = (): McpClientError => {
  return createMcpClientError("Internal server error", 500, {
    code: 500,
    message: "Internal server error",
  });
};

export const mockNetworkError = (): Error => {
  return new Error("Network error: Failed to fetch");
};
