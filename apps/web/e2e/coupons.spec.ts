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
