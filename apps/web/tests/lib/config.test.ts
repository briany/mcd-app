import { describe, it, expect, beforeEach, vi } from "vitest";

// Store original env
const originalEnv = process.env;

describe("config", () => {
  beforeEach(() => {
    // Reset modules to clear cached imports
    vi.resetModules();
    // Create fresh env object for each test
    process.env = { ...originalEnv };
    // Set required env vars for module loading
    process.env.NEXT_PUBLIC_MCP_BASE_URL = "https://api.example.com";
    process.env.MCD_MCP_TOKEN = "test-token";
  });

  describe("getMcpBaseUrl", () => {
    it("returns base URL when NEXT_PUBLIC_MCP_BASE_URL is set", async () => {
      process.env.NEXT_PUBLIC_MCP_BASE_URL = "https://custom.api.com";
      vi.resetModules();
      const { getMcpBaseUrl } = await import("@/lib/config");
      expect(getMcpBaseUrl()).toBe("https://custom.api.com");
    });

    it("handles env variables with special characters", async () => {
      process.env.NEXT_PUBLIC_MCP_BASE_URL = "https://api.example.com/v1?key=value&foo=bar";
      vi.resetModules();
      const { getMcpBaseUrl } = await import("@/lib/config");
      expect(getMcpBaseUrl()).toBe("https://api.example.com/v1?key=value&foo=bar");
    });

    it("handles env variables with unicode", async () => {
      process.env.NEXT_PUBLIC_MCP_BASE_URL = "https://api.café.com";
      vi.resetModules();
      const { getMcpBaseUrl } = await import("@/lib/config");
      expect(getMcpBaseUrl()).toBe("https://api.café.com");
    });

    it("can be accessed from client when using allowClient flag", async () => {
      // Simulate client environment
      const originalWindow = global.window;
      // @ts-expect-error - Creating window object for test
      global.window = {};

      process.env.NEXT_PUBLIC_MCP_BASE_URL = "https://client.api.com";
      vi.resetModules();
      const { getMcpBaseUrl } = await import("@/lib/config");

      // Should NOT throw because getMcpBaseUrl uses { allowClient: true }
      expect(getMcpBaseUrl()).toBe("https://client.api.com");

      // Restore
      global.window = originalWindow;
    });
  });

  describe("getMcpToken", () => {
    it("is server-only and throws in jsdom test environment", async () => {
      // jsdom environment has window defined, so it's treated as client-side
      // This tests that the server-only check works correctly
      const { getMcpToken } = await import("@/lib/config");

      expect(() => getMcpToken()).toThrow(
        "[config] Attempted to read server env MCD_MCP_TOKEN from the client"
      );
    });
  });

  describe("mcpConfig", () => {
    it("exports config object with baseUrl", async () => {
      process.env.NEXT_PUBLIC_MCP_BASE_URL = "https://config.api.com";
      process.env.MCD_MCP_TOKEN = "config-token";
      vi.resetModules();
      const { mcpConfig } = await import("@/lib/config");

      expect(mcpConfig.baseUrl).toBe("https://config.api.com");
      expect(mcpConfig.authHeaders).toBeDefined();
    });

    it("provides auth headers helper function", async () => {
      const { mcpConfig } = await import("@/lib/config");
      expect(typeof mcpConfig.authHeaders).toBe("function");
      // Note: Cannot test actual header values in jsdom environment
      // since getMcpToken() is server-only
    });
  });
});
