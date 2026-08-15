import { test, expect } from "@playwright/test";

/**
 * Records / Reports — all positions or one campaign (DL-354).
 */

test.describe("Reports position scope", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  });

  test("defaults to all positions and offers campaigns", async ({ page }) => {
    await page.goto("/app/reports");
    const scope = page.getByTestId("reports-scope");
    await expect(scope).toBeVisible({ timeout: 30_000 });
    await expect(scope).toContainText(/all positions/i);
    const select = page.getByTestId("practice-campaign-select");
    await expect(select).toBeVisible();
    await expect(select.locator("option").first()).toHaveText(/All positions/i);
  });
});
