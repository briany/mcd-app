import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
  test("should include all required security headers", async ({ page }) => {
    const response = await page.goto("/");

    expect(response).not.toBeNull();
    if (!response) return;

    const headers = response.headers();

    // Check X-Frame-Options
    expect(headers["x-frame-options"]).toBe("DENY");

    // Check X-Content-Type-Options
    expect(headers["x-content-type-options"]).toBe("nosniff");

    // Check Referrer-Policy
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

    // Check Permissions-Policy
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["permissions-policy"]).toContain("microphone=()");

    // Check Content-Security-Policy exists
    expect(headers["content-security-policy"]).toBeDefined();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
  });

  test("should not include HSTS header on HTTP", async ({ page }) => {
    const response = await page.goto("/");

    expect(response).not.toBeNull();
    if (!response) return;

    const headers = response.headers();

    // HSTS should not be present on HTTP
    expect(headers["strict-transport-security"]).toBeUndefined();
  });

  test("sets CORS headers for allowed origin", async ({ page, context }) => {
    // Set the origin header for all requests in this context
    await context.setExtraHTTPHeaders({
      origin: "http://localhost:3000",
    });

    const response = await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    expect(response?.headers()["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
    expect(response?.headers()["access-control-allow-credentials"]).toBe("true");
  });

  test("does not set CORS headers for disallowed origin", async ({ page, context }) => {
    // Set the origin header for all requests in this context
    await context.setExtraHTTPHeaders({
      origin: "http://evil.com",
    });

    const response = await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    expect(response?.headers()["access-control-allow-origin"]).toBeUndefined();
  });
});
