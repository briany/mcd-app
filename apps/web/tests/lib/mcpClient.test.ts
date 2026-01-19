import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mcpClient, McpClientError } from "@/lib/mcpClient";
import {
  mockCouponListResponse,
  mockCampaignListResponse,
  mockAutoClaimResponse,
  mockTimeInfo,
  mockMCPErrorPayload,
  generateCouponsMarkdown,
  generateCampaignsMarkdown,
  generateAutoClaimMarkdown,
} from "../mocks/mcpClient";
import {
  mockMcpMarkdownResponse,
  mockMcpStructuredResponse,
  mockMcpErrorResponse,
  mockFetchError,
} from "../mocks/fetch";

vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
}));

describe("mcpClient", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("McpClientError", () => {
    it("creates error with message, status, and details", () => {
      const error = new McpClientError("Test error", 404, mockMCPErrorPayload);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(404);
      expect(error.details).toEqual(mockMCPErrorPayload);
      expect(error.name).toBe("McpClientError");
    });

    it("creates error without details", () => {
      const error = new McpClientError("Test error", 500);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe("getCoupons", () => {
    it("returns coupon list on success", async () => {
      const markdown = generateCouponsMarkdown(mockCouponListResponse);
      fetchSpy.mockResolvedValue(mockMcpMarkdownResponse(markdown));

      const result = await mcpClient.getCoupons();

      expect(result.coupons).toHaveLength(1);
      expect(result.coupons[0].name).toBe("Test Coupon");
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });

    it("throws McpClientError on HTTP 404", async () => {
      fetchSpy.mockResolvedValue(mockFetchError(404, "Not Found", mockMCPErrorPayload));

      await expect(mcpClient.getCoupons()).rejects.toThrow(McpClientError);
      await expect(mcpClient.getCoupons()).rejects.toMatchObject({
        status: 404,
      });
    });

    it("throws McpClientError on HTTP 500", async () => {
      fetchSpy.mockResolvedValue(mockFetchError(500, "Internal Server Error"));

      await expect(mcpClient.getCoupons()).rejects.toThrow(McpClientError);
      await expect(mcpClient.getCoupons()).rejects.toMatchObject({
        status: 500,
      });
    });

    it("handles network errors", async () => {
      fetchSpy.mockRejectedValue(new Error("Network error"));

      await expect(mcpClient.getCoupons()).rejects.toThrow("Network error");
    });
  });

  describe("getAvailableCoupons", () => {
    it("returns available coupon list on success", async () => {
      const markdown = generateCouponsMarkdown(mockCouponListResponse);
      fetchSpy.mockResolvedValue(mockMcpMarkdownResponse(markdown));

      const result = await mcpClient.getAvailableCoupons();

      expect(result.coupons).toHaveLength(1);
      expect(result.coupons[0].name).toBe("Test Coupon");
    });

    it("throws McpClientError with error details", async () => {
      fetchSpy.mockResolvedValue(mockFetchError(404, "Not found", mockMCPErrorPayload));

      await expect(mcpClient.getAvailableCoupons()).rejects.toThrow(McpClientError);
      const promise = mcpClient.getAvailableCoupons();
      await expect(promise).rejects.toMatchObject({
        details: mockMCPErrorPayload,
      });
    });
  });

  describe("getCampaigns", () => {
    it("returns campaign list without date parameter", async () => {
      const markdown = generateCampaignsMarkdown(mockCampaignListResponse);
      fetchSpy.mockResolvedValue(mockMcpMarkdownResponse(markdown));

      const result = await mcpClient.getCampaigns();

      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0]).toMatchObject({
        id: expect.stringContaining("campaign"),
        description: "A test campaign description",
      });
    });

    it("returns campaign list with date parameter", async () => {
      const markdown = generateCampaignsMarkdown(mockCampaignListResponse);
      fetchSpy.mockResolvedValue(mockMcpMarkdownResponse(markdown));

      const result = await mcpClient.getCampaigns("2026-01-19");

      expect(result.campaigns).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com",
        expect.objectContaining({
          body: expect.stringContaining("specifiedDate"),
        })
      );
    });

    it("handles empty date parameter", async () => {
      const markdown = generateCampaignsMarkdown(mockCampaignListResponse);
      fetchSpy.mockResolvedValue(mockMcpMarkdownResponse(markdown));

      const result = await mcpClient.getCampaigns("");

      expect(result.campaigns).toHaveLength(1);
    });
  });

  describe("autoClaimCoupons", () => {
    it("sends POST request and returns auto-claim response", async () => {
      const markdown = generateAutoClaimMarkdown(mockAutoClaimResponse);
      fetchSpy.mockResolvedValue(mockMcpMarkdownResponse(markdown));

      const result = await mcpClient.autoClaimCoupons();

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("throws McpClientError on failure", async () => {
      fetchSpy.mockResolvedValue(mockFetchError(500, "Server error"));

      await expect(mcpClient.autoClaimCoupons()).rejects.toThrow(McpClientError);
    });
  });

  describe("getTimeInfo", () => {
    it("returns time info on success", async () => {
      fetchSpy.mockResolvedValue(mockMcpStructuredResponse(mockTimeInfo));

      const result = await mcpClient.getTimeInfo();

      expect(result).toEqual(mockTimeInfo);
      expect(result.timestamp).toBe(1737302400000);
      expect(result.year).toBe(2026);
    });
  });

  describe("MCP protocol error handling", () => {
    it("handles MCP-level errors in response", async () => {
      fetchSpy.mockResolvedValue(mockMcpErrorResponse(-32600, "Invalid Request"));

      await expect(mcpClient.getCoupons()).rejects.toThrow(McpClientError);
      await expect(mcpClient.getCoupons()).rejects.toMatchObject({
        message: expect.stringContaining("MCP Error"),
      });
    });

    it("handles missing markdown content", async () => {
      const emptyResponse = {
        jsonrpc: "2.0",
        id: 1,
        result: {
          content: [],
        },
      };
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => emptyResponse,
      } as Response);

      await expect(mcpClient.getCoupons()).rejects.toThrow("No markdown content");
    });

    it("handles missing structured data", async () => {
      const emptyResponse = {
        jsonrpc: "2.0",
        id: 1,
        result: {
          structuredContent: {},
        },
      };
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => emptyResponse,
      } as Response);

      await expect(mcpClient.getTimeInfo()).rejects.toThrow("No structured data");
    });
  });

  describe("error detail parsing", () => {
    it("parses JSON error details when available", async () => {
      const errorPayload = { code: 404, message: "Not found" };
      fetchSpy.mockResolvedValue(mockFetchError(404, "Not Found", errorPayload));

      try {
        await mcpClient.getCoupons();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(McpClientError);
        expect((error as McpClientError).details).toEqual(errorPayload);
      }
    });

    it("handles non-JSON error responses", async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers(),
        text: async () => "Plain text error",
        json: async () => {
          throw new Error("Not JSON");
        },
      } as Response);

      await expect(mcpClient.getCoupons()).rejects.toThrow(McpClientError);
      await expect(mcpClient.getCoupons()).rejects.toMatchObject({
        message: expect.stringContaining("Plain text error"),
      });
    });

    it("uses statusText when response body cannot be read", async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers(),
        text: async () => {
          throw new Error("Cannot read body");
        },
        json: async () => {
          throw new Error("Cannot read body");
        },
      } as Response);

      await expect(mcpClient.getCoupons()).rejects.toThrow(McpClientError);
      await expect(mcpClient.getCoupons()).rejects.toMatchObject({
        message: expect.stringContaining("Internal Server Error"),
      });
    });
  });

  describe("authorization headers", () => {
    it("includes authorization token in all requests", async () => {
      const markdown = generateCouponsMarkdown(mockCouponListResponse);
      fetchSpy.mockResolvedValue(mockMcpMarkdownResponse(markdown));

      await mcpClient.getCoupons();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });
  });
});
