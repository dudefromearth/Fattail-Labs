import { test, expect } from "@playwright/test";

/**
 * Campaign badge color picker + contrast (DL-359).
 */

test.describe("Campaign badge color", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  });

  test("create form picker previews high-contrast ink", async ({ page }) => {
    await page.goto("/app/practice/campaign");
    await expect(page.getByTestId("campaign-library")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("campaign-new").click();
    const picker = page.getByTestId("campaign-color-picker");
    await expect(picker).toBeVisible({ timeout: 15_000 });
    const preview = page.getByTestId("campaign-color-preview");
    const hex = page.getByTestId("campaign-color-hex");
    await expect(preview).toBeVisible();
    await hex.fill("#000000");
    await hex.dispatchEvent("input");
    await expect(preview).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(preview).toHaveCSS("color", "rgb(255, 255, 255)");
    await hex.fill("#FFFFFF");
    await hex.dispatchEvent("input");
    await expect(preview).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(preview).toHaveCSS("color", "rgb(17, 17, 17)");
  });
});
