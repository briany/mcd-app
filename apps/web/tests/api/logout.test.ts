import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

import { POST } from "@/app/api/auth/logout/route";

vi.mock("@/lib/authHelpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/csrf", () => ({
  invalidateCsrfToken: vi.fn(),
}));

vi.mock("@/lib/withCsrf", () => ({
  withCsrf: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}));

vi.mock("@/lib/withRateLimit", () => ({
  withRateLimit: <T extends (...args: unknown[]) => unknown>(handler: T) => handler,
}));

const { requireAuth } = await import("@/lib/authHelpers");
const { invalidateCsrfToken } = await import("@/lib/csrf");

describe("POST /api/auth/logout", () => {
  const createRequest = () =>
    new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        "x-csrf-token": "token",
      },
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      session: null,
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ message: "Unauthorized" });
    expect(invalidateCsrfToken).not.toHaveBeenCalled();
  });

  it("invalidates CSRF token and returns success when authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      error: null,
      session: { user: { id: "1", name: "Test User" } },
    });
    vi.mocked(invalidateCsrfToken).mockResolvedValue();

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(invalidateCsrfToken).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when token invalidation fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(requireAuth).mockResolvedValue({
      error: null,
      session: { user: { id: "1", name: "Test User" } },
    });
    vi.mocked(invalidateCsrfToken).mockRejectedValue(new Error("cookie failure"));

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ message: "Logout failed" });
    consoleErrorSpy.mockRestore();
  });
});
