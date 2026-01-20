import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/coupons/claim/route";
import { NextRequest } from "next/server";
import { mockAutoClaimResponse, mock404Error, mock500Error } from "../mocks/mcpClient";

vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
}));

vi.mock("@/lib/mcpClient", () => ({
  McpClientError: class McpClientError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly details?: unknown
    ) {
      super(message);
      this.name = "McpClientError";
    }
  },
  mcpClient: {
    autoClaimCoupons: vi.fn(),
  },
}));

// Import after mocking
const { mcpClient } = await import("@/lib/mcpClient");

describe("POST /api/coupons/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  it("claims coupon successfully with valid couponId", async () => {
    vi.mocked(mcpClient.autoClaimCoupons).mockResolvedValue(mockAutoClaimResponse);

    const request = createRequest({ couponId: "coupon-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAutoClaimResponse);
    expect(mcpClient.autoClaimCoupons).toHaveBeenCalled();
  });

  it("returns 400 when couponId is missing", async () => {
    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "couponId is required" });
    expect(mcpClient.autoClaimCoupons).not.toHaveBeenCalled();
  });

  it("returns 400 when couponId is null", async () => {
    const request = createRequest({ couponId: null });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "couponId is required" });
    expect(mcpClient.autoClaimCoupons).not.toHaveBeenCalled();
  });

  it("returns 400 when couponId is not a string", async () => {
    const request = createRequest({ couponId: 123 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "couponId is required" });
    expect(mcpClient.autoClaimCoupons).not.toHaveBeenCalled();
  });

  it("returns 400 when couponId is an empty string", async () => {
    const request = createRequest({ couponId: "" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "couponId is required" });
    expect(mcpClient.autoClaimCoupons).not.toHaveBeenCalled();
  });

  it("returns 400 when couponId is an array", async () => {
    const request = createRequest({ couponId: ["coupon-123"] });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "couponId is required" });
    expect(mcpClient.autoClaimCoupons).not.toHaveBeenCalled();
  });

  it("returns 400 when couponId is an object", async () => {
    const request = createRequest({ couponId: { id: "coupon-123" } });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "couponId is required" });
    expect(mcpClient.autoClaimCoupons).not.toHaveBeenCalled();
  });

  it("handles McpClientError with 404 status", async () => {
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(mock404Error());

    const request = createRequest({ couponId: "nonexistent-coupon" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles McpClientError with 500 status", async () => {
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(mock500Error());

    const request = createRequest({ couponId: "coupon-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles generic errors", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(new Error("Network failure"));

    const request = createRequest({ couponId: "coupon-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An unexpected error occurred",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[API Error]",
      expect.objectContaining({
        error: expect.any(Error),
        timestamp: expect.any(String),
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it("handles malformed JSON in request body", async () => {
    const request = {
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as NextRequest;

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An unexpected error occurred",
    });

    consoleErrorSpy.mockRestore();
  });
});
