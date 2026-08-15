import { test, expect } from "@playwright/test";

const TOS =
  "BUY +1 BUTTERFLY SPCX 100 (Weeklys) 28 AUG 26 130/150/170 CALL @6.61 LMT";

test.describe("New Trade chooser", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/api/auth/dev-login-practice");
    await page.waitForURL(/\/app\/trade-log/, { timeout: 30_000 });
    await expect(page.getByTestId("trade-log-table")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("clipboard ticket is detected on New Trade", async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText("not a ticket"));
    await page.getByTestId("trade-log-new-trade").click();
    await expect(page.getByRole("dialog", { name: /new trade/i })).toBeVisible();
    await expect(page.getByTestId("tos-script-window")).toHaveCount(0);

    const chooser = page.getByTestId("new-trade-chooser");
    if (await chooser.count()) {
      await page.getByLabel("Close panel").click();
    } else {
      await page.getByRole("button", { name: /^cancel$/i }).click();
    }

    await page.evaluate((s) => navigator.clipboard.writeText(s), TOS);
    await page.getByTestId("trade-log-new-trade").click();
    await expect(page.getByTestId("tos-script-window")).toBeVisible();
    await expect(page.getByTestId("tos-script-field")).toContainText("SPCX");
    await page.getByTestId("tos-script-field").click();
    await expect(page.getByTestId("new-trade-chooser")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("close list scrolls when more than three opens", async ({ page }) => {
    await page.getByTestId("trade-log-new-trade").click();
    const list = page.getByTestId("new-trade-close-list");
    if ((await list.count()) === 0) return;
    const n = await list.locator("li").count();
    if (n <= 3) {
      await expect(list).toHaveAttribute("data-scrollable", "false");
      return;
    }
    await expect(list).toHaveAttribute("data-scrollable", "true");
  });
});
