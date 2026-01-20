import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/available-coupons/auto-claim/route";
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

describe("POST /api/available-coupons/auto-claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auto-claims coupons successfully", async () => {
    vi.mocked(mcpClient.autoClaimCoupons).mockResolvedValue(mockAutoClaimResponse);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAutoClaimResponse);
    expect(data.success).toBe(true);
    expect(data.claimed).toBe(5);
    expect(data.message).toBe("Successfully claimed 5 coupons");
    expect(mcpClient.autoClaimCoupons).toHaveBeenCalledTimes(1);
  });

  it("handles auto-claim with zero coupons claimed", async () => {
    const zeroCouponsResponse = {
      success: true,
      claimed: 0,
      message: "No coupons available to claim",
    };
    vi.mocked(mcpClient.autoClaimCoupons).mockResolvedValue(zeroCouponsResponse);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(zeroCouponsResponse);
    expect(data.claimed).toBe(0);
  });

  it("handles McpClientError with 404 status", async () => {
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(mock404Error());

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles McpClientError with 500 status", async () => {
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(mock500Error());

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles generic errors", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(new Error("Network failure"));

    const response = await POST();
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

  it("handles rate limiting errors", async () => {
    const rateLimitError = {
      message: "Too many requests",
      status: 429,
      details: { code: 429, message: "Rate limit exceeded" },
    };
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(rateLimitError);

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An unexpected error occurred",
    });

    consoleErrorSpy.mockRestore();
  });
});
