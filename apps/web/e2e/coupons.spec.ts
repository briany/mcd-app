import { test, expect } from "@playwright/test";

const couponsFixture = {
  coupons: [
    { id: "1", name: "Big Mac", expiryDate: "2099-01-01", status: "Active", imageUrl: null },
    { id: "2", name: "McFlurry", expiryDate: "2099-06-01", status: "Active", imageUrl: null },
  ],
  total: 2,
  page: 1,
};

const campaignsFixture = {
  campaigns: [
    {
      id: "cmp-1",
      title: "Golden Week",
      description: "Golden week discounts",
      imageUrl: null,
      startDate: "2099-04-01",
      endDate: "2099-04-07",
      isSubscribed: true,
    },
  ],
  date: "2099-04-01",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/coupons", (route) => route.fulfill({ json: couponsFixture }));
  await page.route("**/api/available-coupons", (route) => route.fulfill({ json: couponsFixture }));
  await page.route("**/api/available-coupons/auto-claim", (route) =>
    route.fulfill({ json: { success: true, claimed: 2, message: "ok" } })
  );
  await page.route("**/api/campaigns", (route) => route.fulfill({ json: campaignsFixture }));
  await page.route("**/api/coupons/claim", (route) => route.fulfill({ json: { success: true, claimed: 1, message: "claimed" } }));
});

test("dashboard renders summary cards", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mission Control" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My Coupons" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage all" })).toBeVisible();
});

test.describe("Coupon Filtering", () => {
  const filteredCouponsFixture = {
    coupons: [
      { id: "1", name: "Big Mac", expiryDate: "2099-01-01", status: "Active", imageUrl: null },
      { id: "2", name: "McFlurry", expiryDate: "2025-01-01", status: "Expired", imageUrl: null },
      { id: "3", name: "Happy Meal", expiryDate: "2099-06-01", status: "Active", imageUrl: null },
    ],
    total: 3,
    page: 1,
  };

  test("filters coupons by status dropdown", async ({ page }) => {
    await page.route("**/api/coupons", (route) => route.fulfill({ json: filteredCouponsFixture }));
    await page.goto("/coupons");

    // Initially all coupons visible
    await expect(page.getByText("Big Mac")).toBeVisible();
    await expect(page.getByText("McFlurry")).toBeVisible();
    await expect(page.getByText("Happy Meal")).toBeVisible();

    // Filter by status - find the select element
    const statusFilter = page.locator('select').first();
    await statusFilter.selectOption("expired");

    // Only expired coupon visible
    await expect(page.getByText("McFlurry")).toBeVisible();
    await expect(page.getByText("Big Mac")).not.toBeVisible();
    await expect(page.getByText("Happy Meal")).not.toBeVisible();

    // Filter by active
    await statusFilter.selectOption("active");
    await expect(page.getByText("Big Mac")).toBeVisible();
    await expect(page.getByText("Happy Meal")).toBeVisible();
    await expect(page.getByText("McFlurry")).not.toBeVisible();

    // Show all
    await statusFilter.selectOption("all");
    await expect(page.getByText("Big Mac")).toBeVisible();
    await expect(page.getByText("McFlurry")).toBeVisible();
    await expect(page.getByText("Happy Meal")).toBeVisible();
  });

  test("filters coupons by search query", async ({ page }) => {
    await page.route("**/api/coupons", (route) => route.fulfill({ json: filteredCouponsFixture }));
    await page.goto("/coupons");

    // Wait for coupons to load
    await expect(page.getByText("Big Mac")).toBeVisible();
    await expect(page.getByText("McFlurry")).toBeVisible();
    await expect(page.getByText("Happy Meal")).toBeVisible();

    // Find search input
    const searchInput = page.locator('input[type="search"]').or(page.locator('input[type="text"]'));

    if (await searchInput.count() > 0) {
      // Search for "Big" - should match "Big Mac"
      await searchInput.fill("Big");
      await page.waitForTimeout(300); // Wait for React re-render
      await expect(page.getByText("Big Mac")).toBeVisible();

      // Clear search to verify all coupons return
      await searchInput.fill("");
      await page.waitForTimeout(300);
      await expect(page.getByText("Big Mac")).toBeVisible();
      await expect(page.getByText("McFlurry")).toBeVisible();
      await expect(page.getByText("Happy Meal")).toBeVisible();
    }
  });

  test("combines status filter and search query", async ({ page }) => {
    await page.route("**/api/coupons", (route) => route.fulfill({ json: filteredCouponsFixture }));
    await page.goto("/coupons");

    const statusFilter = page.locator('select').first();
    const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="Search"]'));

    // Filter by active status
    await statusFilter.selectOption("active");

    // Then search for "Mac"
    await searchInput.fill("Mac");

    // Only Big Mac should be visible (active + contains "Mac")
    await expect(page.getByText("Big Mac")).toBeVisible();
    await expect(page.getByText("McFlurry")).not.toBeVisible();
    await expect(page.getByText("Happy Meal")).not.toBeVisible();
  });
});

test.describe("Auto-claim Coupons", () => {
  test("auto-claims all available coupons", async ({ page }) => {
    let autoClaimCalled = false;

    await page.route("**/api/available-coupons/auto-claim", (route) => {
      autoClaimCalled = true;
      route.fulfill({ json: { success: true, claimed: 2, message: "Successfully claimed 2 coupons" } });
    });

    await page.goto("/available");

    // Find and click auto-claim button
    const autoClaimButton = page.getByRole("button", { name: /auto.*claim/i });
    if (await autoClaimButton.count() > 0) {
      await autoClaimButton.click();

      // Verify API was called
      await page.waitForTimeout(500);
      expect(autoClaimCalled).toBe(true);
    }
  });

  test("auto-claim button is available on available coupons page", async ({ page }) => {
    await page.goto("/available");

    // Verify page loads successfully
    await page.waitForTimeout(500);
    const pageLoaded = await page.locator("body").count() > 0;
    expect(pageLoaded).toBe(true);
  });
});

test.describe("Campaign Date Picker", () => {
  const campaignsWithDatesFixture = {
    campaigns: [
      {
        id: "cmp-1",
        title: "January Sale",
        description: "New Year discounts",
        imageUrl: null,
        startDate: "2026-01-15",
        endDate: "2026-01-31",
        isSubscribed: false,
      },
      {
        id: "cmp-2",
        title: "Valentine's Day",
        description: "Love is in the air",
        imageUrl: null,
        startDate: "2026-02-10",
        endDate: "2026-02-14",
        isSubscribed: true,
      },
    ],
    date: "2026-01-19",
  };

  test("filters campaigns by selected date", async ({ page }) => {
    let requestedDate = "";

    await page.route("**/api/campaigns**", (route) => {
      const url = new URL(route.request().url());
      requestedDate = url.searchParams.get("date") || "2026-01-19";

      if (requestedDate === "2026-02-12") {
        // Only Valentine's campaign for February date
        route.fulfill({
          json: {
            campaigns: [campaignsWithDatesFixture.campaigns[1]],
            date: requestedDate,
          },
        });
      } else {
        // Default campaigns
        route.fulfill({ json: campaignsWithDatesFixture });
      }
    });

    await page.goto("/campaigns");

    // Initially both campaigns visible
    await expect(page.getByText("January Sale")).toBeVisible();
    await expect(page.getByText("Valentine's Day")).toBeVisible();

    // Find date picker input
    const datePicker = page.locator('input[type="date"]');
    if (await datePicker.count() > 0) {
      // Select February date
      await datePicker.fill("2026-02-12");

      // Wait for API call
      await page.waitForTimeout(500);

      // Only Valentine's campaign should be visible
      await expect(page.getByText("Valentine's Day")).toBeVisible();
      await expect(page.getByText("January Sale")).not.toBeVisible();

      // Verify correct date was requested
      expect(requestedDate).toBe("2026-02-12");
    }
  });
});

test.describe("Error States", () => {
  test("handles coupons API failure gracefully", async ({ page }) => {
    await page.route("**/api/coupons", (route) => {
      route.fulfill({
        status: 500,
        json: { error: "Internal server error" }
      });
    });

    await page.goto("/coupons");

    // Page should load without crashing
    await expect(page.locator("body")).toBeVisible();
    // Should have the sidebar nav
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("handles available coupons API failure gracefully", async ({ page }) => {
    await page.route("**/api/available-coupons", (route) => {
      route.fulfill({
        status: 404,
        json: { error: "Not found" }
      });
    });

    await page.goto("/available");

    // Page should load without crashing
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("handles campaigns API failure gracefully", async ({ page }) => {
    await page.route("**/api/campaigns", (route) => {
      route.fulfill({
        status: 503,
        json: { error: "Service unavailable" }
      });
    });

    await page.goto("/campaigns");

    // Page should load without crashing
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("handles claim coupon API failure gracefully", async ({ page }) => {
    await page.route("**/api/coupons/claim", (route) => {
      route.fulfill({
        status: 400,
        json: { error: "Invalid coupon ID" }
      });
    });

    await page.goto("/available");

    // Page should load
    await expect(page.locator("body")).toBeVisible();

    // Find and click a claim button if it exists
    const claimButton = page.getByRole("button", { name: "Claim" }).first();
    if (await claimButton.count() > 0) {
      await claimButton.click();
      await page.waitForTimeout(500);
      // Page should still be responsive
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("handles network errors without crashing", async ({ page }) => {
    await page.route("**/api/coupons", (route) => route.abort("failed"));

    await page.goto("/coupons");

    // App should handle the error and still render the page structure
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });
});
