import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/available-coupons/route";
import { mockCouponListResponse, mock404Error, mock500Error } from "../mocks/mcpClient";

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
    getAvailableCoupons: vi.fn(),
  },
}));

// Import after mocking
const { mcpClient } = await import("@/lib/mcpClient");

describe("GET /api/available-coupons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available coupon data on success", async () => {
    vi.mocked(mcpClient.getAvailableCoupons).mockResolvedValue(mockCouponListResponse);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCouponListResponse);
    expect(mcpClient.getAvailableCoupons).toHaveBeenCalledTimes(1);
  });

  it("handles McpClientError with 404 status", async () => {
    vi.mocked(mcpClient.getAvailableCoupons).mockRejectedValue(mock404Error());

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles McpClientError with 500 status", async () => {
    vi.mocked(mcpClient.getAvailableCoupons).mockRejectedValue(mock500Error());

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles generic errors", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mcpClient.getAvailableCoupons).mockRejectedValue(new Error("Network failure"));

    const response = await GET();
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

  it("handles undefined error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mcpClient.getAvailableCoupons).mockRejectedValue(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An unexpected error occurred",
    });

    consoleErrorSpy.mockRestore();
  });
});
