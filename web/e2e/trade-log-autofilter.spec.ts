import { test, expect, type Page } from "@playwright/test";

/**
 * TLAF2 — Trade Log Autofilter cutover (A1–A3, A9, A11, suite chrome).
 * Auth: Labs-local practice login (same as other Trade Log e2e).
 */

async function loginTradeLog(page: Page) {
  await page.goto("/api/auth/dev-login-practice");
  await page.waitForURL(/\/app\/trade-log/, { timeout: 30_000 });
  await expect(page.getByTestId("trade-log-table")).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("Trade Log Autofilter (TLAF2)", () => {
  test("A1 A2 A3 A11 — title-bar Autofilter; no dual campaign; date omitted", async ({
    page,
  }) => {
    await loginTradeLog(page);

    await expect(page.getByTestId("trade-log-autofilter")).toBeVisible();
    await expect(page.getByTestId("blotter-campaign-filter")).toHaveCount(0);
    await expect(page.getByTestId("practice-granularity")).toHaveCount(0);
    await expect(page.getByTestId("practice-campaign-select")).toHaveCount(0);
    await expect(page.getByTestId("practice-account-select")).toBeVisible();
    await expect(page.getByTestId("blotter-playbook-filter")).toBeVisible();
    await expect(page.getByText(/^Open:/)).toHaveCount(0);

    await page.getByTestId("trade-log-autofilter").click();
    const panel = page.getByTestId("trade-log-autofilter-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/exec time/i)).toBeVisible();
    await expect(panel.getByText(/^campaign$/i)).toBeVisible();
    await expect(panel.getByText(/^strategy$/i)).toBeVisible();
    await expect(panel.getByText(/^symbol$/i)).toBeVisible();
    await expect(panel.getByText(/^status$/i)).toBeVisible();
    const order = await panel.locator("span.font-semibold").allTextContents();
    expect(order.map((s) => s.trim().toLowerCase())).toEqual([
      "exec time",
      "campaign",
      "strategy",
      "symbol",
      "status",
    ]);
    await page.screenshot({
      path: "../agents/p-autofilter/evidence/tlas1-strategy-column.png",
      fullPage: false,
    });
  });

  test("Journal / Reports / Retro / Playbook still show date and campaign chrome", async ({
    page,
  }) => {
    await loginTradeLog(page);
    for (const path of [
      "/app/journal",
      "/app/reports",
      "/app/retrospective",
      "/app/playbook",
    ]) {
      await page.goto(path);
      await expect(
        page.getByTestId("practice-granularity"),
        `${path} date chrome`,
      ).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByTestId("practice-campaign-select"),
        `${path} campaign chrome`,
      ).toBeVisible();
      await expect(page.getByTestId("practice-account-select")).toBeVisible();
    }
  });
});
