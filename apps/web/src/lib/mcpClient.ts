import "server-only";

import { getMcpBaseUrl, getMcpToken } from "@/lib/config";
import { safeMatch } from "@/lib/safeRegex";
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
 * MCP JSON-RPC response structure
 */
interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content?: Array<{ text?: string; type?: string }>;
    isError?: boolean;
    structuredContent?: {
      success: boolean;
      code: number;
      message: string;
      data?: unknown;
    };
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Make a JSON-RPC request to the MCP server and return raw response
 * @param toolName The MCP tool name (e.g., "my-coupons", "available-coupons")
 * @param args Optional arguments for the tool
 */
const callMcpTool = async (
  toolName: string,
  args?: Record<string, unknown>
): Promise<MCPResponse> => {
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

      try {
        details = JSON.parse(text) as MCPErrorPayload;
      } catch {
        // Not JSON, use text
      }
    } catch {
      // Couldn't read response body
    }

    throw new McpClientError(
      `MCP request failed (${response.status}): ${errorMessage}`,
      response.status,
      details
    );
  }

  const mcpResponse = (await response.json()) as MCPResponse;

  // Check for MCP-level errors
  if (mcpResponse.error) {
    throw new McpClientError(
      `MCP Error ${mcpResponse.error.code}: ${mcpResponse.error.message}`,
      500,
      mcpResponse.error
    );
  }

  if (mcpResponse.result?.isError) {
    throw new McpClientError("MCP request returned an error", 500);
  }

  return mcpResponse;
};

/**
 * Extract markdown text from MCP response
 */
const extractMarkdown = (mcpResponse: MCPResponse): string => {
  const text = mcpResponse.result?.content?.[0]?.text;
  if (!text) {
    throw new McpClientError("No markdown content in MCP response", 500);
  }
  return text;
};

/**
 * Extract structured data from MCP response
 */
const extractStructuredData = <T>(mcpResponse: MCPResponse): T => {
  const data = mcpResponse.result?.structuredContent?.data;
  if (!data) {
    throw new McpClientError("No structured data in MCP response", 500);
  }
  return data as T;
};

/**
 * Simple markdown parser for coupons
 */
const parseCouponsMarkdown = (markdown: string): CouponListResponse => {
  const coupons: CouponListResponse["coupons"] = [];

  // Extract total and page info from header (using safeMatch for ReDoS protection)
  const headerMatch = safeMatch(markdown, /共\s*(\d+)\s*张.*第\s*(\d+)\/\d+\s*页/);
  const total = headerMatch ? parseInt(headerMatch[1], 10) : 0;
  const page = headerMatch ? parseInt(headerMatch[2], 10) : 1;

  // Split by ## headers (each coupon section)
  const sections = markdown.split(/\n##\s+/).slice(1); // Skip first empty section

  sections.forEach((section, index) => {
    const lines = section.split("\n");
    const name = lines[0].trim();

    // Extract image URL (using safeMatch for ReDoS protection)
    const imgMatch = safeMatch(section, /<img\s+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    // Extract expiry date from "有效期" line (using safeMatch for ReDoS protection)
    const expiryMatch = safeMatch(section, /有效期[^:]*:\s*(\d{4}-\d{2}-\d{2})/);
    const expiryDate = expiryMatch ? expiryMatch[1] : new Date().toISOString().split("T")[0];

    // Store full section as rawMarkdown (prepend ## header for proper rendering)
    const rawMarkdown = `## ${section}`;

    coupons.push({
      id: `coupon-${index}`,
      name,
      imageUrl,
      expiryDate,
      status: "active",
      rawMarkdown,
    });
  });

  return { coupons, total, page };
};

/**
 * Simple markdown parser for campaigns
 */
const parseCampaignsMarkdown = (markdown: string, date: string): CampaignListResponse => {
  const campaigns: CampaignListResponse["campaigns"] = [];

  // Split by campaign items (marked by "活动标题")
  const sections = markdown.split(/(?=\*\*活动标题\*\*)/);

  sections.forEach((section, index) => {
    if (!section.includes("活动标题")) return;

    // Extract title (using safeMatch for ReDoS protection)
    const titleMatch = safeMatch(section, /\*\*活动标题\*\*[：:]\s*([^\\]+?)\\/);
    const title = titleMatch ? titleMatch[1].trim() : `Campaign ${index}`;

    // Extract description (first line after 活动内容介绍) (using safeMatch for ReDoS protection)
    const descMatch = safeMatch(section, /\*\*活动内容介绍\*\*[：:]\s*([^\n]+)/);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract image URL (using safeMatch for ReDoS protection)
    const imgMatch = safeMatch(section, /<img\s+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    campaigns.push({
      id: `campaign-${index}`,
      title,
      description,
      imageUrl,
      startDate: date || new Date().toISOString().split("T")[0],
      endDate: date || new Date().toISOString().split("T")[0],
      isSubscribed: false,
    });
  });

  return { campaigns, date: date || new Date().toISOString().split("T")[0] };
};

export const mcpClient = {
  /**
   * Get user's claimed coupons
   * Uses MCP tool: my-coupons
   */
  getCoupons: async (): Promise<CouponListResponse> => {
    const response = await callMcpTool("my-coupons");
    const markdown = extractMarkdown(response);
    return parseCouponsMarkdown(markdown);
  },

  /**
   * Get available coupons that can be claimed
   * Uses MCP tool: available-coupons
   */
  getAvailableCoupons: async (): Promise<CouponListResponse> => {
    const response = await callMcpTool("available-coupons");
    const markdown = extractMarkdown(response);
    return parseCouponsMarkdown(markdown);
  },

  /**
   * Get campaign calendar
   * Uses MCP tool: campaign-calender
   * @param date Optional date in yyyy-MM-dd format
   */
  getCampaigns: async (date?: string): Promise<CampaignListResponse> => {
    const args = date ? { specifiedDate: date } : undefined;
    const response = await callMcpTool("campaign-calender", args);
    const markdown = extractMarkdown(response);
    return parseCampaignsMarkdown(markdown, date || "");
  },

  /**
   * Auto-claim all available coupons
   * Uses MCP tool: auto-bind-coupons
   *
   * Note: MCP server only supports batch auto-claim, not individual coupon claiming.
   */
  autoClaimCoupons: async (): Promise<AutoClaimResponse> => {
    const response = await callMcpTool("auto-bind-coupons");
    const markdown = extractMarkdown(response);

    // Simple success detection
    const success = !markdown.includes("失败") && !markdown.includes("错误");
    return {
      success,
      claimed: 0, // Can't reliably parse from markdown
      message: markdown.substring(0, 200), // First 200 chars
    };
  },

  /**
   * Get current server time information
   * Uses MCP tool: now-time-info
   */
  getTimeInfo: async (): Promise<TimeInfo> => {
    const response = await callMcpTool("now-time-info");
    return extractStructuredData<TimeInfo>(response);
  },
};
