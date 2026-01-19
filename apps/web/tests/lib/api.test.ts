import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleApiError } from "@/lib/api";
import { McpClientError } from "@/lib/mcpClient";

vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
}));

describe("handleApiError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("handles McpClientError with status and details", async () => {
    const error = new McpClientError("Not found", 404, {
      code: 404,
      message: "Resource not found",
    });

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      message: "Not found",
      details: {
        code: 404,
        message: "Resource not found",
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("handles McpClientError without details", async () => {
    const error = new McpClientError("Internal server error", 500);

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Internal server error",
      details: undefined,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("handles McpClientError with various status codes", async () => {
    const testCases = [
      { status: 400, message: "Bad Request" },
      { status: 401, message: "Unauthorized" },
      { status: 403, message: "Forbidden" },
      { status: 404, message: "Not Found" },
      { status: 422, message: "Unprocessable Entity" },
      { status: 500, message: "Internal Server Error" },
      { status: 503, message: "Service Unavailable" },
    ];

    for (const { status, message } of testCases) {
      const error = new McpClientError(message, status);
      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(status);
      expect(data.message).toBe(message);
    }
  });

  it("handles generic Error and returns 500", async () => {
    const error = new Error("Network failure");

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected MCP API error", error);
  });

  it("handles TypeError and returns 500", async () => {
    const error = new TypeError("Cannot read property 'x' of undefined");

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected MCP API error", error);
  });

  it("handles string error and returns 500", async () => {
    const error = "Something went wrong";

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected MCP API error", error);
  });

  it("handles null error and returns 500", async () => {
    const error = null;

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected MCP API error", error);
  });

  it("handles undefined error and returns 500", async () => {
    const error = undefined;

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected MCP API error", error);
  });

  it("handles object error and returns 500", async () => {
    const error = { custom: "error object" };

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      message: "Unexpected MCP API error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected MCP API error", error);
  });

  it("logs error exactly once for non-McpClientError", async () => {
    const error = new Error("Test error");

    handleApiError(error);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected MCP API error", error);
  });

  it("does not log McpClientError", async () => {
    const error = new McpClientError("Expected error", 404);

    handleApiError(error);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("preserves error details in McpClientError response", async () => {
    const details = {
      code: 422,
      message: "Validation failed",
      errors: [
        { field: "email", message: "Invalid email format" },
        { field: "password", message: "Password too weak" },
      ],
    };
    const error = new McpClientError("Validation error", 422, details);

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.details).toEqual(details);
  });
});
