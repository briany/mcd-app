import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError } from "@/lib/api";
import { McpClientError } from "@/lib/mcpClient";

vi.mock("@/lib/config", () => ({
  getMcpBaseUrl: vi.fn(() => "https://api.example.com"),
  getMcpToken: vi.fn(() => "test-token-123"),
}));

describe("handleApiError", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.clearAllMocks();
  });

  describe("in development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("includes full error details for McpClientError", async () => {
      const error = new McpClientError("Test error", 400, { foo: "bar" });
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.message).toBe("Test error");
      expect(data.details).toEqual({ foo: "bar" });
    });

    it("includes validation details for ZodError", async () => {
      const schema = z.object({ name: z.string() });
      try {
        schema.parse({ name: 123 });
      } catch (error) {
        const response = handleApiError(error);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.message).toBe("Validation failed");
        expect(data.details).toBeDefined();
        expect(Array.isArray(data.details)).toBe(true);
      }
    });

    it("includes stack trace for generic Error", async () => {
      const error = new Error("Generic error");
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.message).toBe("Generic error");
      expect(data.details).toBeDefined();
      expect(data.details.stack).toBeDefined();
    });
  });

  describe("in production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("sanitizes McpClientError messages", async () => {
      const error = new McpClientError("Sensitive error", 400, { secret: "key" });
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.message).toBe("An error occurred while processing your request");
      expect(data.details).toBeUndefined();
    });

    it("sanitizes ZodError messages", async () => {
      const schema = z.object({ name: z.string() });
      try {
        schema.parse({ name: 123 });
      } catch (error) {
        const response = handleApiError(error);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.message).toBe("Validation failed");
        expect(data.details).toBeUndefined();
      }
    });

    it("sanitizes generic Error messages", async () => {
      const error = new Error("Sensitive internal error");
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.message).toBe("An unexpected error occurred");
      expect(data.details).toBeUndefined();
    });

    it("handles unknown errors", async () => {
      const error = "string error";
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.message).toBe("An unexpected error occurred");
      expect(data.details).toBeUndefined();
    });
  });

  it("always logs errors to console", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Test error");

    handleApiError(error);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[API Error]",
      expect.objectContaining({
        error,
        timestamp: expect.any(String),
        stack: expect.any(String),
      })
    );
  });
});
