import { test, expect } from "@playwright/test";

/**
 * T Ortho: live 5m chart, locked surface, narrative floater on-screen.
 * Language is position (not strategy).
 */

const POS_KEY = "ft_options_lab_analyzer_positions_v2";

const seedPos = {
  id: "e2e-pos-1",
  label: "SPX short put vertical",
  notation: "-1 5600P / +1 5550P",
  status: "ANALYSIS",
  livePackagePerShare: 1.2,
  lastNatSigned: -1.2,
  definedDebitPerShare: -1.2,
  priceSide: "credit",
  visible: true,
  lock: { mode: "unlocked" },
  liveState: "live",
  displayAsOf: null,
  contentHashes: {},
  maxSkewMs: null,
  epochQuality: null,
  createdAt: 1,
  updatedAt: 1,
  position: {
    underlying: "SPX",
    expiration: "2026-08-21",
    contracts: 1,
    direction: "sell",
    legs: [
      { strike: 5600, type: "put", quantity: 1, side: "short", entry_price: 2.1 },
      { strike: 5550, type: "put", quantity: 1, side: "long", entry_price: 0.9 },
    ],
  },
};

test("T Ortho narrative floater is on-screen and has no book chrome", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.goto("/app/options-lab/surface?symbol=SPX");
  await page.evaluate(
    ({ key, pos }) => {
      localStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem("options-lab-symbol", "SPX");
    },
    { key: POS_KEY, pos: seedPos },
  );
  await page.reload();

  await expect(page.getByTestId("surface-host")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("surface-view-timeOrtho").click();

  const host = page.getByTestId("surface-host");
  await expect(host).toHaveAttribute("data-time-ortho", "1");
  await expect(page.getByTestId("surface-canvas")).toHaveAttribute(
    "data-surface-locked",
    "1",
  );
  await expect(page.getByTestId("surface-time-ortho-live-chart")).toBeVisible();
  await expect(page.getByTestId("surface-time-ortho-tape")).toHaveAttribute(
    "data-x-open",
    /\d+/,
    { timeout: 20_000 },
  );
  const floater = page.getByTestId("surface-time-ortho-copy");
  await expect(floater).toBeVisible();
  await expect(page.getByTestId("surface-time-ortho-ai")).toBeVisible();
  await expect(floater).not.toContainText(/strateg/i);
  await expect(floater).not.toContainText("Position List");
  await expect(floater).not.toContainText("This is your position sitting");
  await expect(page.getByTestId("surface-time-ortho-add")).toHaveCount(0);
  await expect(page.getByTestId("surface-time-ortho-capture")).toHaveCount(0);
  const box = await floater.boundingBox();
  const hostBox = await host.boundingBox();
  expect(box).toBeTruthy();
  expect(hostBox).toBeTruthy();
  if (box && hostBox) {
    expect(box.x).toBeGreaterThanOrEqual(hostBox.x);
    expect(box.y).toBeGreaterThanOrEqual(hostBox.y);
    expect(box.x + box.width).toBeLessThanOrEqual(hostBox.x + hostBox.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(
      hostBox.y + hostBox.height + 1,
    );
  }
});

test("T Ortho goes away when the last position is removed", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.goto("/app/options-lab/surface?symbol=SPX");
  await page.evaluate(
    ({ key, pos }) => {
      localStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem("options-lab-symbol", "SPX");
    },
    { key: POS_KEY, pos: seedPos },
  );
  await page.reload();

  await expect(page.getByTestId("surface-host")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("surface-view-timeOrtho").click();
  await expect(page.getByTestId("surface-host")).toHaveAttribute(
    "data-time-ortho",
    "1",
  );
  await expect(page.getByTestId("surface-time-ortho-live-chart")).toBeVisible();
  await expect(page.getByTestId("surface-time-ortho-copy")).toBeVisible();

  await page.evaluate((key) => {
    localStorage.setItem(key, "[]");
    sessionStorage.setItem(key, "[]");
    window.dispatchEvent(new Event("ftl-analyzer-book"));
  }, POS_KEY);

  await expect(page.getByTestId("surface-host")).toHaveAttribute(
    "data-time-ortho",
    "0",
  );
  await expect(page.getByTestId("surface-time-ortho-live-chart")).toHaveCount(0);
  await expect(page.getByTestId("surface-time-ortho-copy")).toHaveCount(0);
  const leftover = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(list) ? list.length : -1;
  }, POS_KEY);
  expect(leftover).toBe(0);
});

test("T Ortho tape stays cached when leaving and returning", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.goto("/app/options-lab/surface?symbol=SPX");
  await page.evaluate(
    ({ key, pos }) => {
      localStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem(key, JSON.stringify([pos]));
      sessionStorage.setItem("options-lab-symbol", "SPX");
    },
    { key: POS_KEY, pos: seedPos },
  );
  await page.reload();

  await expect(page.getByTestId("surface-host")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("surface-view-timeOrtho").click();
  const tape = page.getByTestId("surface-time-ortho-tape");
  await expect(tape).toHaveAttribute("data-x-open", /\d+/, { timeout: 25_000 });

  await page.getByTestId("surface-view-time").click();
  await expect(page.getByTestId("surface-host")).toHaveAttribute(
    "data-time-ortho",
    "0",
  );
  await expect(page.getByTestId("surface-time-ortho-live-chart")).toHaveCount(1);
  await expect(page.getByTestId("surface-time-ortho-live-chart")).toHaveAttribute(
    "data-armed",
    "0",
  );

  await page.getByTestId("surface-view-timeOrtho").click();
  await expect(page.getByTestId("surface-host")).toHaveAttribute(
    "data-time-ortho",
    "1",
  );
  await expect(tape).toHaveAttribute("data-x-open", /\d+/);
  await expect(page.getByTestId("surface-time-ortho-live-chart")).toHaveAttribute(
    "data-armed",
    "1",
  );
});
