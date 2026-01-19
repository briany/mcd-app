import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mcpClient, McpClientError } from "@/lib/mcpClient";
import {
  mockCouponListResponse,
  mockCampaignListResponse,
  mockAutoClaimResponse,
  mockTimeInfo,
  mockMCPErrorPayload,
} from "../mocks/mcpClient";
import { mockFetchSuccess, mockFetchError, mockFetchNoContent } from "../mocks/fetch";

// Mock config functions
vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
}));

describe("McpClientError", () => {
  it("creates error with message, status, and details", () => {
    const error = new McpClientError("Test error", 404, mockMCPErrorPayload);

    expect(error.message).toBe("Test error");
    expect(error.status).toBe(404);
    expect(error.details).toEqual(mockMCPErrorPayload);
    expect(error.name).toBe("McpClientError");
    expect(error).toBeInstanceOf(Error);
  });

  it("creates error without details", () => {
    const error = new McpClientError("Simple error", 500);

    expect(error.message).toBe("Simple error");
    expect(error.status).toBe(500);
    expect(error.details).toBeUndefined();
  });
});

describe("mcpClient", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCoupons", () => {
    it("returns coupon list on success", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockCouponListResponse));

      const result = await mcpClient.getCoupons();

      expect(result).toEqual(mockCouponListResponse);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/coupons",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          }),
          cache: "no-store",
        })
      );
    });

    it("throws McpClientError on 404", async () => {
      fetchSpy.mockResolvedValue(mockFetchError(404, "Not Found", mockMCPErrorPayload));

      await expect(mcpClient.getCoupons()).rejects.toThrow(McpClientError);
      await expect(mcpClient.getCoupons()).rejects.toMatchObject({
        status: 404,
        details: mockMCPErrorPayload,
      });
    });

    it("throws McpClientError on 500", async () => {
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
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockCouponListResponse));

      const result = await mcpClient.getAvailableCoupons();

      expect(result).toEqual(mockCouponListResponse);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/available-coupons",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });

    it("throws McpClientError with error details", async () => {
      const errorPayload = { code: 403, message: "Forbidden" };
      fetchSpy.mockResolvedValue(mockFetchError(403, "Forbidden", errorPayload));

      await expect(mcpClient.getAvailableCoupons()).rejects.toMatchObject({
        status: 403,
        details: errorPayload,
      });
    });
  });

  describe("getCampaigns", () => {
    it("returns campaign list without date parameter", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockCampaignListResponse));

      const result = await mcpClient.getCampaigns();

      expect(result).toEqual(mockCampaignListResponse);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/campaigns",
        expect.anything()
      );
    });

    it("returns campaign list with date parameter", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockCampaignListResponse));

      const result = await mcpClient.getCampaigns("2026-01-19");

      expect(result).toEqual(mockCampaignListResponse);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/campaigns?date=2026-01-19",
        expect.anything()
      );
    });

    it("handles empty date parameter", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockCampaignListResponse));

      const result = await mcpClient.getCampaigns("");

      expect(result).toEqual(mockCampaignListResponse);
      // Empty string should not add query parameter
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/campaigns",
        expect.anything()
      );
    });
  });

  describe("autoClaimCoupons", () => {
    it("sends POST request and returns auto-claim response", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockAutoClaimResponse));

      const result = await mcpClient.autoClaimCoupons();

      expect(result).toEqual(mockAutoClaimResponse);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/auto-claim",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });

    it("throws McpClientError on failure", async () => {
      fetchSpy.mockResolvedValue(mockFetchError(400, "Bad Request"));

      await expect(mcpClient.autoClaimCoupons()).rejects.toMatchObject({
        status: 400,
      });
    });
  });

  describe("claimCoupon", () => {
    it("sends POST request with couponId", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockAutoClaimResponse));

      const result = await mcpClient.claimCoupon("coupon-123");

      expect(result).toEqual(mockAutoClaimResponse);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/coupons/coupon-123/claim",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("handles special characters in couponId", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockAutoClaimResponse));

      await mcpClient.claimCoupon("coupon-with-special-chars-!@#");

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("coupon-with-special-chars-!@#"),
        expect.anything()
      );
    });
  });

  describe("getTimeInfo", () => {
    it("returns time info on success", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess(mockTimeInfo));

      const result = await mcpClient.getTimeInfo();

      expect(result).toEqual(mockTimeInfo);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.example.com/time",
        expect.anything()
      );
    });
  });

  describe("204 No Content handling", () => {
    it("returns undefined for 204 responses", async () => {
      fetchSpy.mockResolvedValue(mockFetchNoContent());

      const result = await mcpClient.getCoupons();

      expect(result).toBeUndefined();
    });
  });

  describe("error response parsing", () => {
    it("parses JSON error details when available", async () => {
      const errorDetails = { code: 422, message: "Validation failed" };
      fetchSpy.mockResolvedValue(mockFetchError(422, "Unprocessable Entity", errorDetails));

      try {
        await mcpClient.getCoupons();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(McpClientError);
        expect((error as McpClientError).details).toEqual(errorDetails);
      }
    });

    it("handles non-JSON error responses", async () => {
      const response = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers(),
        text: async () => "Plain text error",
        json: async () => {
          throw new Error("Not JSON");
        },
        clone: function () {
          return this;
        },
      } as Response;

      fetchSpy.mockResolvedValue(response);

      try {
        await mcpClient.getCoupons();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(McpClientError);
        expect((error as McpClientError).message).toContain("Plain text error");
        expect((error as McpClientError).status).toBe(500);
      }
    });

    it("uses statusText when response body cannot be read", async () => {
      const response = {
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers(),
        text: async () => {
          throw new Error("Cannot read body");
        },
        json: async () => {
          throw new Error("Cannot read body");
        },
        clone: function () {
          return this;
        },
      } as Response;

      fetchSpy.mockResolvedValue(response);

      try {
        await mcpClient.getCoupons();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(McpClientError);
        expect((error as McpClientError).message).toContain("Service Unavailable");
        expect((error as McpClientError).status).toBe(503);
      }
    });
  });

  describe("authorization headers", () => {
    it("includes authorization token in all requests", async () => {
      fetchSpy.mockResolvedValue(mockFetchSuccess({}));

      await mcpClient.getCoupons();
      await mcpClient.getAvailableCoupons();
      await mcpClient.getCampaigns();
      await mcpClient.autoClaimCoupons();
      await mcpClient.claimCoupon("test");
      await mcpClient.getTimeInfo();

      expect(fetchSpy).toHaveBeenCalledTimes(6);
      fetchSpy.mock.calls.forEach((call) => {
        const headers = (call[1] as RequestInit)?.headers as Record<string, string>;
        expect(headers.Authorization).toBe("Bearer test-token-123");
      });
    });
  });
});
