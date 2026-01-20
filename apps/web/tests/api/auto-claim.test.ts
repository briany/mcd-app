import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/available-coupons/auto-claim/route";
import { mockAutoClaimResponse, mock404Error, mock500Error } from "../mocks/mcpClient";

vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
}));

vi.mock("@/lib/authHelpers", () => ({
  requireAuth: vi.fn(() =>
    Promise.resolve({
      error: null,
      session: { user: { id: "1", name: "Test User" } },
    })
  ),
}));

vi.mock("@/lib/withCsrf", () => ({
  withCsrf: (handler: any) => handler,
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
    expect(data).toMatchObject({
      message: expect.stringContaining("Not found"),
      details: {
        code: 404,
        message: "Resource not found",
      },
    });
  });

  it("handles McpClientError with 500 status", async () => {
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(mock500Error());

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      message: expect.any(String),
      details: {
        code: 500,
        message: "Internal server error",
      },
    });
  });

  it("handles generic errors", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mcpClient.autoClaimCoupons).mockRejectedValue(new Error("Network failure"));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unexpected MCP API error",
      expect.any(Error)
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
      message: "Unexpected MCP API error",
    });

    consoleErrorSpy.mockRestore();
  });
});
