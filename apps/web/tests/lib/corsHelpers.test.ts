import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/config", () => ({
  allowedOrigins: ["http://localhost:3000"],
}));

import { handleCorsPreFlight } from "@/lib/corsHelpers";

describe("corsHelpers", () => {
  describe("handleCorsPreFlight", () => {
    it("should return 204 for allowed origin", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      });

      const response = handleCorsPreFlight(request);

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
      expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("should return 403 for disallowed origin", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
        headers: { origin: "http://evil.com" },
      });

      const response = handleCorsPreFlight(request);

      expect(response.status).toBe(403);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("should return 403 when no origin header", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
      });

      const response = handleCorsPreFlight(request);

      expect(response.status).toBe(403);
    });

    it("should include correct CORS headers for allowed origin", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      });

      const response = handleCorsPreFlight(request);

      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
      expect(response.headers.get("Access-Control-Allow-Headers")).toContain("X-CSRF-Token");
      expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
      expect(response.headers.get("Vary")).toContain("Origin");
    });
  });
});
