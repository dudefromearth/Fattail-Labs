import { test, expect } from "@playwright/test";

test("Strike ladder shows each greek in its own column and scrolls sideways", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.setViewportSize({ width: 800, height: 800 });
  await page.goto("/app/options-lab/heatmap");
  const tpl = page.getByTestId("heatmap-template");
  await expect(tpl).toBeVisible({ timeout: 30_000 });
  await tpl.selectOption("ladder");

  const table = page.getByTestId("heatmap-strike-ladder");
  await expect(table).toBeVisible({ timeout: 30_000 });
  await expect(table.getByRole("columnheader", { name: "Strike" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Δ" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Γ" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Θ" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Vega" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "IV" })).toBeVisible();

  const headers = await table.locator("thead th").allTextContents();
  expect(headers.map((h) => h.trim())).toEqual([
    "Strike",
    "Mid",
    "Src",
    "Bid",
    "Ask",
    "Last",
    "Vol",
    "OI",
    "Δ",
    "Γ",
    "Θ",
    "Vega",
    "IV",
  ]);

  const scroller = page.locator(
    "[data-testid='heatmap-view-panel'] .overflow-x-auto",
  );
  await expect(scroller).toBeVisible();
  const overflow = await scroller.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(
    overflow.scrollWidth,
    "ladder table must scroll horizontally when the snapshot is wider than the panel",
  ).toBeGreaterThan(overflow.clientWidth);
});
