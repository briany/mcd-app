import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getTokenMock = vi.fn();

vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => getTokenMock(...args),
}));

describe("middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    getTokenMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createRequest = (pathname: string, headers: HeadersInit = {}) =>
    new NextRequest(`http://localhost:3000${pathname}`, { headers });

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
});
