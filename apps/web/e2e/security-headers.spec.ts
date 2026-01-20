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
});
