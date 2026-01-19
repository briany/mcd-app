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

/**
 * MCP JSON-RPC request body format
 */
interface MCPRequest {
  method: "tools/call";
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

/**
 * Make a JSON-RPC request to the MCP server
 * @param toolName The MCP tool name (e.g., "my-coupons", "available-coupons")
 * @param args Optional arguments for the tool
 */
const callMcpTool = async <T>(
  toolName: string,
  args?: Record<string, unknown>
): Promise<T> => {
  const body: MCPRequest = {
    method: "tools/call",
    params: {
      name: toolName,
      ...(args && Object.keys(args).length > 0 ? { arguments: args } : {}),
    },
  };

  const response = await fetch(getMcpBaseUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getMcpToken()}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    let details: MCPErrorPayload | undefined;
    let errorMessage = response.statusText;

    try {
      const text = await response.text();
      errorMessage = text || response.statusText;

      // Try to parse as JSON for structured error details
      try {
        details = JSON.parse(text) as MCPErrorPayload;
      } catch {
        // Not JSON, that's fine - we have the text for the error message
      }
    } catch {
      // Couldn't read response body, use statusText
    }

    throw new McpClientError(
      `MCP request failed (${response.status}): ${errorMessage}`,
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
  /**
   * Get user's claimed coupons
   * Uses MCP tool: my-coupons
   */
  getCoupons: () => callMcpTool<CouponListResponse>("my-coupons"),

  /**
   * Get available coupons that can be claimed
   * Uses MCP tool: available-coupons
   */
  getAvailableCoupons: () => callMcpTool<CouponListResponse>("available-coupons"),

  /**
   * Get campaign calendar
   * Uses MCP tool: campaign-calender
   * @param date Optional date in yyyy-MM-dd format
   */
  getCampaigns: (date?: string) => {
    const args = date ? { specifiedDate: date } : undefined;
    return callMcpTool<CampaignListResponse>("campaign-calender", args);
  },

  /**
   * Auto-claim all available coupons
   * Uses MCP tool: auto-bind-coupons
   *
   * Note: MCP server only supports batch auto-claim, not individual coupon claiming.
   * The Swift implementation also only has autoClaimCoupons, no single-claim method.
   */
  autoClaimCoupons: () => callMcpTool<AutoClaimResponse>("auto-bind-coupons"),

  /**
   * Get current server time information
   * Uses MCP tool: now-time-info
   */
  getTimeInfo: () => callMcpTool<TimeInfo>("now-time-info"),
};
