import { test, expect } from "@playwright/test";

const POS_KEY = "ft_options_lab_analyzer_positions_v2";

const seedPos = {
  id: "e2e-xh-1",
  label: "SPX 20-wide fly",
  notation: "+1 5990C / -2 6010C / +1 6030C",
  status: "ANALYSIS",
  visible: true,
  lock: { mode: "unlocked" },
  liveState: "live",
  createdAt: 1,
  updatedAt: 1,
  position: {
    underlying: "SPX",
    expiration: "2026-12-18",
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: 5990, type: "call", quantity: 1, side: "long", entry_price: 12 },
      { strike: 6010, type: "call", quantity: 2, side: "short", entry_price: 8 },
      { strike: 6030, type: "call", quantity: 1, side: "long", entry_price: 5 },
    ],
  },
};

test("Analyzer plot hover paints scale crosshair chips", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await page.evaluate(
    ({ key, pos }) => {
      localStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem("options-lab-symbol", "SPX");
    },
    { key: POS_KEY, pos: seedPos },
  );
  await page.reload();

  const host = page.getByTestId("pnl-chart-host");
  await expect(host).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(async () => host.getAttribute("data-painted"), { timeout: 20_000 })
    .toBe("1");

  const box = await host.boundingBox();
  expect(box, "chart host has a box").toBeTruthy();
  if (!box) return;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect
    .poll(async () => host.getAttribute("data-crosshair-price"), {
      timeout: 8_000,
    })
    .toMatch(/^\d+(\.\d{2})?$/);
  const expChip = await host.getAttribute("data-crosshair-exp");
  const theoChip = await host.getAttribute("data-crosshair-theo");
  if (expChip) expect(expChip).toMatch(/^[+-]\d+$/);
  if (theoChip) expect(theoChip).toMatch(/^[+-]\d+$/);

  await page.screenshot({
    path: "test-results/analyzer-crosshair.png",
    fullPage: false,
  });

  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await expect
    .poll(async () => host.getAttribute("data-crosshair-price"), {
      timeout: 8_000,
    })
    .toBeNull();
});
