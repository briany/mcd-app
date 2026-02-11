import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getTokenMock = vi.fn();
const logSecurityEventMock = vi.fn();

vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => getTokenMock(...args),
}));

vi.mock("@/lib/logging", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/logging")>();
  return {
    ...actual,
    logSecurityEvent: (...args: unknown[]) => logSecurityEventMock(...args),
  };
});

describe("middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    getTokenMock.mockReset();
    logSecurityEventMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createRequest = (pathname: string, headers: HeadersInit = {}) =>
    new NextRequest(`http://localhost:3000${pathname}`, { headers });

  const getCommonHeaders = (response: Response) => ({
    allowOrigin: response.headers.get("Access-Control-Allow-Origin"),
    allowCredentials: response.headers.get("Access-Control-Allow-Credentials"),
    vary: response.headers.get("Vary"),
    csp: response.headers.get("Content-Security-Policy"),
    frameOptions: response.headers.get("X-Frame-Options"),
    contentTypeOptions: response.headers.get("X-Content-Type-Options"),
    referrerPolicy: response.headers.get("Referrer-Policy"),
    permissionsPolicy: response.headers.get("Permissions-Policy"),
  });

  it("does not allow E2E auth bypass in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.E2E_TEST_MODE = "true";
    process.env.NEXTAUTH_SECRET = "test-secret";
    getTokenMock.mockResolvedValue(null);

    const { middleware } = await import("@/middleware");

    const response = await middleware(createRequest("/api/coupons"));
    const body = await response.json();

    expect(getTokenMock).toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(body).toEqual({ message: "Unauthorized" });
  });

  it("allows E2E auth bypass outside production", async () => {
    process.env.NODE_ENV = "test";
    process.env.E2E_TEST_MODE = "true";
    getTokenMock.mockResolvedValue(null);

    const { middleware } = await import("@/middleware");

    const response = await middleware(
      createRequest("/api/coupons", { origin: "http://localhost:3000" })
    );

    expect(getTokenMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000"
    );
    expect(response.headers.get("Vary")).toContain("Origin");
  });

  it("applies consistent security and CORS headers across all middleware exits", async () => {
    process.env.NODE_ENV = "test";
    process.env.NEXTAUTH_SECRET = "test-secret";
    getTokenMock.mockResolvedValue(null);

    const { middleware } = await import("@/middleware");

    const headers = { origin: "http://localhost:3000" };
    const normalResponse = await middleware(createRequest("/auth/signin", headers));
    const apiUnauthorizedResponse = await middleware(
      createRequest("/api/coupons", headers)
    );
    const redirectResponse = await middleware(createRequest("/coupons", headers));

    expect(apiUnauthorizedResponse.status).toBe(401);
    expect(redirectResponse.status).toBe(307);

    const expectedHeaders = getCommonHeaders(normalResponse);
    expect(getCommonHeaders(apiUnauthorizedResponse)).toEqual(expectedHeaders);
    expect(getCommonHeaders(redirectResponse)).toEqual(expectedHeaders);
  });

  it("keeps unsafe-eval in CSP outside production for compatibility", async () => {
    process.env.NODE_ENV = "development";

    const { middleware } = await import("@/middleware");

    const response = await middleware(createRequest("/auth/signin"));

    expect(response.headers.get("Content-Security-Policy")).toContain(
      "'unsafe-eval'"
    );
  });

  it("removes unsafe-eval from CSP in production", async () => {
    process.env.NODE_ENV = "production";

    const { middleware } = await import("@/middleware");

    const response = await middleware(createRequest("/auth/signin"));
    const csp = response.headers.get("Content-Security-Policy");

    expect(csp).toContain("script-src");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("logs unauthorized API access with minimal request context", async () => {
    process.env.NODE_ENV = "test";
    process.env.NEXTAUTH_SECRET = "test-secret";
    getTokenMock.mockResolvedValue(null);

    const { middleware } = await import("@/middleware");

    await middleware(createRequest("/api/coupons?token=secret"));

    expect(logSecurityEventMock).toHaveBeenCalledWith({
      type: "unauthorized_api_access",
      details: {
        method: "GET",
        pathname: "/api/coupons",
      },
    });
  });

  it("logs unauthorized page access with minimal request context", async () => {
    process.env.NODE_ENV = "test";
    process.env.NEXTAUTH_SECRET = "test-secret";
    getTokenMock.mockResolvedValue(null);

    const { middleware } = await import("@/middleware");

    await middleware(createRequest("/campaigns"));

    expect(logSecurityEventMock).toHaveBeenCalledWith({
      type: "unauthorized_page_access",
      details: {
        method: "GET",
        pathname: "/campaigns",
      },
    });
  });

  it("logs blocked origins and does not set CORS allow headers", async () => {
    process.env.NODE_ENV = "test";

    const { middleware } = await import("@/middleware");
    const response = await middleware(
      createRequest("/auth/signin", { origin: "https://evil.example" })
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    expect(logSecurityEventMock).toHaveBeenCalledWith({
      type: "blocked_origin",
      details: {
        method: "GET",
        origin: "https://evil.example",
        pathname: "/auth/signin",
      },
    });
  });
});
