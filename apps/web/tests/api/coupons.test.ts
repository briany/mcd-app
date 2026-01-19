import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/coupons/route";
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
    getCoupons: vi.fn(),
  },
}));

// Import after mocking
const { mcpClient } = await import("@/lib/mcpClient");

describe("GET /api/coupons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns coupon data on success", async () => {
    vi.mocked(mcpClient.getCoupons).mockResolvedValue(mockCouponListResponse);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCouponListResponse);
    expect(mcpClient.getCoupons).toHaveBeenCalledTimes(1);
  });

  it("handles McpClientError with 404 status", async () => {
    vi.mocked(mcpClient.getCoupons).mockRejectedValue(mock404Error());

    const response = await GET();
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
    vi.mocked(mcpClient.getCoupons).mockRejectedValue(mock500Error());

    const response = await GET();
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
    vi.mocked(mcpClient.getCoupons).mockRejectedValue(new Error("Network failure"));

    const response = await GET();
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

  it("handles undefined error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mcpClient.getCoupons).mockRejectedValue(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });

    consoleErrorSpy.mockRestore();
  });
});
