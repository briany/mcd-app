import "server-only";

import { getMcpBaseUrl, getMcpToken } from "@/lib/config";
import type {
  AutoClaimResponse,
  CampaignListResponse,
  CouponListResponse,
  TimeInfo,
  MCPErrorPayload,
} from "@/lib/types";

export class McpClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: MCPErrorPayload
  ) {
    super(message);
    this.name = "McpClientError";
  }
}

const withBase = (path: string): string => {
  const url = new URL(path, getMcpBaseUrl());
  return url.toString();
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(withBase(path), {
    ...init,
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getMcpToken()}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let details: MCPErrorPayload | undefined;
    try {
      details = (await response.json()) as MCPErrorPayload;
    } catch {
      // ignore body parsing errors; response text is surfaced via message
    }

    const text = await response.text();
    throw new McpClientError(
      `MCP request failed (${response.status}): ${text || response.statusText}`,
      response.status,
      details
    );
  }

  if (response.status === 204) {
    // @ts-expect-error: returning void when T is void is acceptable for callers expecting no data
    return undefined;
  }

  return (await response.json()) as T;
};

export const mcpClient = {
  getCoupons: () => request<CouponListResponse>("/coupons"),
  getAvailableCoupons: () => request<CouponListResponse>("/available-coupons"),
  getCampaigns: (date?: string) => {
    const searchParams = new URLSearchParams();
    if (date) {
      searchParams.set("date", date);
    }
    const query = searchParams.toString();
    const path = query ? `/campaigns?${query}` : "/campaigns";
    return request<CampaignListResponse>(path);
  },
  autoClaimCoupons: () => request<AutoClaimResponse>("/auto-claim", { method: "POST" }),
  claimCoupon: (couponId: string) =>
    request<AutoClaimResponse>(`/coupons/${couponId}/claim`, { method: "POST" }),
  getTimeInfo: () => request<TimeInfo>("/time"),
};
