import { test, expect } from "@playwright/test";

/**
 * Find and tag — Campaigns main page (DL-351).
 * Found set is date range + position count. Table pages; it does not dump the book.
 */

test.describe("Find and tag found set", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  });

  test("names the found set and pages the table", async ({ page }) => {
    await page.goto("/app/practice/campaign");
    const banner = page.getByTestId("find-tag-found-set");
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText(/Found set/i);
    const count = page.getByTestId("find-tag-found-count");
    await expect(count).toBeVisible();
    await expect(count).toContainText(/position/i);
    const empty = await count.innerText();
    if (!/0 positions/.test(empty)) {
      await expect(page.getByTestId("find-tag-found-range")).toBeVisible();
      await expect(page.getByTestId("find-tag-found-range")).toContainText("→");
      const rows = page.getByTestId("find-tag-row");
      expect(await rows.count()).toBeLessThanOrEqual(50);
    }
  });

  test("When AutoFilter stages year then month then day", async ({ page }) => {
    await page.goto("/app/practice/campaign");
    await expect(page.getByTestId("find-tag-found-count")).toBeVisible({
      timeout: 30_000,
    });
    const empty = await page.getByTestId("find-tag-found-count").innerText();
    if (/0 positions/.test(empty)) return;
    await page.getByTestId("campaign-autofilter-toggle").click();
    await page.getByTestId("autofilter-when").click();
    const menu = page.getByTestId("autofilter-menu-when");
    await expect(menu).toBeVisible();
    const years = menu.getByTestId(/^when-year-\d{4}$/);
    await expect(years.first()).toBeVisible();
    const yearCount = await years.count();
    const months = menu.getByTestId(/^when-month-\d{4}-\d{2}$/);
    const days = menu.getByTestId(/^when-day-\d{4}-\d{2}-\d{2}$/);
    if (yearCount === 1) {
      await expect(months.first()).toBeVisible();
    } else {
      await expect(months).toHaveCount(0);
    }
    await expect(days).toHaveCount(0);
    if (yearCount === 1) {
      await menu.getByTestId(/^when-month-toggle-/).first().click();
      await expect(days.first()).toBeVisible();
    }
  });

  test("clear campaign re-applies the campaign filter", async ({ page }) => {
    await page.goto("/app/practice/campaign");
    await expect(page.getByTestId("find-tag-found-count")).toBeVisible({
      timeout: 30_000,
    });
    const empty = await page.getByTestId("find-tag-found-count").innerText();
    if (/0 positions/.test(empty)) return;

    const title = `Find-tag e2e ${Date.now()}`;
    const setup = await page.evaluate(async (title) => {
      const campRes = await fetch("/api/me/practice/campaigns", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          activate: true,
          max_drawdown_pct: 15,
          starts_at: "2020-01-01",
          starting_capital: 10000,
        }),
      });
      if (!campRes.ok) return null;
      const camp = await campRes.json();
      const found = await (
        await fetch("/api/me/trade-log/found", { credentials: "same-origin" })
      ).json();
      const first = (found.items || [])[0] as
        | { id: number; practice_campaign_id: number | null }
        | undefined;
      if (!first || !camp.campaign?.id) return null;
      if (first.practice_campaign_id != null) {
        await fetch(`/api/me/trade-log/trades/${first.id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practice_campaign_id: null }),
        });
      }
      const stamped = await fetch(`/api/me/trade-log/trades/${first.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practice_campaign_id: camp.campaign.id }),
      });
      if (!stamped.ok) return null;
      return { cid: camp.campaign.id as number, tid: first.id as number, title };
    }, title);
    if (!setup) return;

    await page.reload();
    await expect(page.getByTestId("find-tag-found-count")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("campaign-autofilter-toggle").click();
    await page.getByTestId("autofilter-campaign").click();
    const menu = page.getByTestId("autofilter-menu-campaign");
    await expect(menu).toBeVisible();
    await menu.getByText("(Select All)").click();
    await menu.locator("label").filter({ hasText: title }).first().click();
    await menu.getByRole("button", { name: "OK" }).click();

    const cell = page.getByTestId("find-tag-campaign-" + setup.tid);
    await expect(cell).toBeVisible({ timeout: 15_000 });
    await expect(cell).toHaveAttribute("data-campaign", String(setup.cid));

    await page.getByTestId("find-tag-select-all").check();
    await page.getByTestId("campaign-alloc-clear").click();

    await expect(cell).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("find-tag-found-count")).toContainText(
      /0 positions/,
    );
  });
});
