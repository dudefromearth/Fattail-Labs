import { test, expect } from "@playwright/test";

/**
 * Retro Heading Card — Reporting Standards Spec v0.1 §7a · DL-344.
 * Prerequisites: web + API running, LABS_ENV=dev for /api/auth/dev-login.
 */

test.describe("Retrospective heading card", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  });

  test("library page headers with the compass heading card", async ({
    page,
  }) => {
    await page.goto("/app/retrospective");
    const card = page.getByTestId("retro-heading-card");
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { level: 1 })).not.toHaveText(
      /Reading the compass/i,
    );
    await expect(card.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("retro-heading-score")).toBeVisible();
    await expect(page.getByTestId("retro-heading-shape")).toBeVisible();
    await expect(page.getByTestId("retro-heading-drawdown")).toBeVisible();
    await expect(page.getByTestId("retro-heading-drawdown-current")).toBeVisible();
    await expect(page.getByTestId("retro-heading-practice")).toBeVisible();
    await expect(page.getByTestId("retro-heading-shape")).toContainText(
      /full (book|curve)|this period/i,
    );
    await expect(page.getByTestId("retro-heading-practice")).toContainText(
      /full compass|this period/i,
    );
    await expect(card).toContainText(/true north/i);
    await expect(page.getByTestId("retro-heading-drawdown")).toContainText(
      /trading capital|allocated|capital/i,
    );
    await expect(card).not.toContainText(/win rate is a compass/i);
    await expect(page.getByTestId("retro-start-button")).toBeVisible();
    await expect(page.getByTestId("retro-list").or(page.getByText(/No retrospectives yet/i))).toBeVisible();
    await page.screenshot({
      path: "test-results/retro-heading-library.png",
      fullPage: true,
    });
  });

  test("workspace opens with the same heading card", async ({ page }) => {
    await page.goto("/app/retrospective");
    const first = page.locator('[data-testid="retro-list"] a').first();
    if ((await first.count()) === 0) {
      test.skip(true, "No retrospective to open");
      return;
    }
    await first.click();
    await expect(page).toHaveURL(/\/app\/retrospective\/\d+/);
    const card = page.getByTestId("retro-heading-card");
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("retro-heading-shape")).toBeVisible();
    await expect(page.getByTestId("retrospective-workspace")).toBeVisible();
    await page.screenshot({
      path: "test-results/retro-heading-workspace.png",
      fullPage: true,
    });
  });

  test("heading card holds on a phone-width library", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/retrospective");
    const card = page.getByTestId("retro-heading-card");
    await expect(card).toBeVisible();
    await expect(page.getByTestId("retro-heading-practice")).toBeVisible();
    await expect(page.getByTestId("retro-start-button")).toBeVisible();
    await page.screenshot({
      path: "test-results/retro-heading-library-mobile.png",
      fullPage: true,
    });
  });
});
