import { test, expect } from "@playwright/test";

test("Alert Builder opens on the left of the canvas", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");

  const host = page.getByTestId("pnl-chart-host");
  await expect(host).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("analyzer-alert-create").click();

  const dialog = page.getByTestId("analyzer-alert-builder");
  await expect(dialog).toBeVisible({ timeout: 10_000 });

  const canvas = await host.boundingBox();
  const panel = await dialog.boundingBox();
  expect(canvas, "canvas box").toBeTruthy();
  expect(panel, "builder box").toBeTruthy();
  if (!canvas || !panel) return;

  expect(panel.x).toBeGreaterThanOrEqual(canvas.x - 4);
  expect(panel.x).toBeLessThan(canvas.x + 48);
  expect(panel.x).toBeLessThan(canvas.x + canvas.width / 2);
});
