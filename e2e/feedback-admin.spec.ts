import { test, expect } from "@playwright/test";

test.describe("Feedback Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/feedback");
  });

  test("should require authentication", async ({ page }) => {
    await expect(page.locator("text=Authentication Required")).toBeVisible();
  });

  test("should display feedback list for admins", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "mock-admin-session",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin/feedback");
    await expect(page.locator("text=Feedback Dashboard")).toBeVisible();
  });

  test("should filter feedback by status", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "mock-admin-session",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin/feedback");
    await page.getByTestId("select-filter-status").click();
    await page.locator("text=Resolved").click();

    await expect(page.url()).toContain("status=resolved");
  });

  test("should open feedback detail dialog", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "mock-admin-session",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin/feedback");
    await page.getByTestId("row-feedback-1").click();

    await expect(page.locator("text=Details")).toBeVisible();
  });

  test("should handle search", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "mock-admin-session",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin/feedback");
    await page.getByTestId("input-search-feedback").fill("bug report");
    await page.waitForTimeout(1000);

    await expect(page.url()).toContain("search=");
  });
});

