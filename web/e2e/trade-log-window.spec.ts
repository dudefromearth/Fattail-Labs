import { test, expect } from "@playwright/test";

/**
 * Blotter display window — 20–50 contract rows (DL-347).
 * Does not change lazy-load page size.
 */

test.describe("Trade Log display window", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  });

  test("window control steps 20–50 and only changes viewport height", async ({
    page,
  }) => {
    await page.goto("/app/trade-log");
    const table = page.getByTestId("trade-log-table");
    await expect(table).toBeVisible({ timeout: 30_000 });
    const select = page.getByTestId("blotter-window-rows");
    const viewport = page.getByTestId("blotter-window");
    await expect(select).toBeVisible();
    await expect(viewport).toHaveAttribute("data-window-rows", "20");
    const max20 = await viewport.evaluate((el) =>
      parseFloat((el as HTMLElement).style.maxHeight || "0"),
    );
    await select.selectOption("50");
    await expect(viewport).toHaveAttribute("data-window-rows", "50");
    const max50 = await viewport.evaluate((el) =>
      parseFloat((el as HTMLElement).style.maxHeight || "0"),
    );
    expect(max50).toBeGreaterThan(max20);
    expect(max20).toBe(42 + 20 * 36);
    expect(max50).toBe(42 + 50 * 36);
  });
});
