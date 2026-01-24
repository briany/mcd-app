import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/campaigns/route";
import { mockCampaignListResponse, mock404Error, mock500Error } from "../mocks/mcpClient";

vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
  allowedOrigins: ["http://localhost:3000"],
}));

vi.mock("@/lib/authHelpers", () => ({
  requireAuth: vi.fn(() =>
    Promise.resolve({
      error: null,
      session: { user: { id: "1", name: "Test User" } },
    })
  ),
}));

vi.mock("@/lib/withRateLimit", () => ({
  withRateLimit: vi.fn((handler) => handler),
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
    getCampaigns: vi.fn(),
  },
}));

// Import after mocking
const { mcpClient } = await import("@/lib/mcpClient");

describe("GET /api/campaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(url: string): NextRequest {
    return new NextRequest(url);
  }

  it("returns campaign data without date parameter", async () => {
    vi.mocked(mcpClient.getCampaigns).mockResolvedValue(mockCampaignListResponse);

    const request = createRequest("https://example.com/api/campaigns");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCampaignListResponse);
    expect(mcpClient.getCampaigns).toHaveBeenCalledWith(undefined);
  });

  it("returns campaign data with date parameter", async () => {
    vi.mocked(mcpClient.getCampaigns).mockResolvedValue(mockCampaignListResponse);

    const request = createRequest("https://example.com/api/campaigns?date=2026-01-19");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCampaignListResponse);
    expect(mcpClient.getCampaigns).toHaveBeenCalledWith("2026-01-19");
  });

  it("handles empty date parameter as undefined", async () => {
    vi.mocked(mcpClient.getCampaigns).mockResolvedValue(mockCampaignListResponse);

    const request = createRequest("https://example.com/api/campaigns?date=");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Validation failed");
    expect(data.errors).toContainEqual({
      path: "date",
      message: "Invalid date format. Use yyyy-MM-dd",
    });
    expect(mcpClient.getCampaigns).not.toHaveBeenCalled();
  });

  it("handles multiple query parameters", async () => {
    vi.mocked(mcpClient.getCampaigns).mockResolvedValue(mockCampaignListResponse);

    const request = createRequest("https://example.com/api/campaigns?date=2026-01-19&other=value");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCampaignListResponse);
    expect(mcpClient.getCampaigns).toHaveBeenCalledWith("2026-01-19");
  });

  it("handles date parameter with various formats", async () => {
    vi.mocked(mcpClient.getCampaigns).mockResolvedValue(mockCampaignListResponse);

    const request = createRequest("https://example.com/api/campaigns?date=2026-12-31");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mcpClient.getCampaigns).toHaveBeenCalledWith("2026-12-31");
  });

  it("handles McpClientError with 404 status", async () => {
    vi.mocked(mcpClient.getCampaigns).mockRejectedValue(mock404Error());

    const request = createRequest("https://example.com/api/campaigns");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles McpClientError with 500 status", async () => {
    vi.mocked(mcpClient.getCampaigns).mockRejectedValue(mock500Error());

    const request = createRequest("https://example.com/api/campaigns?date=2026-01-19");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "An error occurred while processing your request",
    });
  });

  it("handles generic errors", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mcpClient.getCampaigns).mockRejectedValue(new Error("Network failure"));

    const request = createRequest("https://example.com/api/campaigns");
    const response = await GET(request);
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

  it("handles invalid URL gracefully", async () => {
    vi.mocked(mcpClient.getCampaigns).mockResolvedValue(mockCampaignListResponse);

    // URL with special characters in date
    const request = createRequest("https://example.com/api/campaigns?date=2026-01-19%20extra");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Validation failed");
    expect(data.errors).toContainEqual({
      path: "date",
      message: "Invalid date format. Use yyyy-MM-dd",
    });
    expect(mcpClient.getCampaigns).not.toHaveBeenCalled();
  });
});
