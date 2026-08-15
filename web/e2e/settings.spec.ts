import { test, expect } from "@playwright/test";

/**
 * Member Settings — Appearance + Alerts (Spec v1.0 · DL-338).
 * Prerequisites: web + API running, LABS_ENV=dev for /api/auth/dev-login.
 */

test.describe("Member Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  });

  test("account menu has Settings; appearance and alerts work", async ({
    page,
  }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /Account menu/ }).click();
    const settingsLink = page.getByTestId("nav-settings");
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByTestId("member-settings")).toBeVisible();
    await expect(page.getByTestId("settings-appearance")).toBeVisible();

    await page.getByTestId("settings-scheme-dark").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByTestId("settings-scheme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByTestId("settings-scheme-system").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");

    await page.getByTestId("settings-font-large").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-font-size",
      "large",
    );

    await page.getByTestId("settings-font-medium").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-font-size");

    await page.getByTestId("settings-nav-alerts").click();
    await expect(page).toHaveURL(/section=alerts/);
    await expect(page.getByTestId("settings-alerts")).toBeVisible();
    await expect(page.getByTestId("settings-alerts-not-live")).toBeVisible();
    await expect(page.getByTestId("settings-dest-sms")).toBeDisabled();
    await expect(page.getByTestId("settings-dest-email_digest")).toBeDisabled();
    await expect(page.getByText("Coming soon").first()).toBeVisible();

    await page.getByTestId("settings-add-rule").click();
    await expect(page.getByTestId("settings-alert-rule")).toHaveCount(1);
  });
});
