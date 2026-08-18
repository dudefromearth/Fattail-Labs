import { test, expect } from "@playwright/test";

/**
 * T Ortho egg: live 5m chart, locked surface, Position List hide/show/add.
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

test("T Ortho Position List hide/show + Analyzer add language", async ({
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
  await expect(page.getByTestId("surface-time-ortho-copy")).toContainText(
    "position",
  );
  await expect(page.getByTestId("surface-time-ortho-copy")).not.toContainText(
    /strateg/i,
  );
  await expect(page.getByTestId("surface-time-ortho-pos-heading")).toHaveText(
    /Position List/,
  );
  await expect(page.getByTestId("surface-time-ortho-add")).toHaveText(
    "Add position",
  );

  const vis = page.getByTestId("surface-time-ortho-vis-e2e-pos-1");
  await expect(vis).toHaveText("Hide");
  await vis.click({ force: true });
  await expect(vis).toHaveText("Show");
  const hidden = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as Array<{ visible?: boolean }>) : [];
    return list[0]?.visible === false;
  }, POS_KEY);
  expect(hidden).toBe(true);
  await vis.click({ force: true });
  await expect(vis).toHaveText("Hide");

  await expect(page.getByTestId("surface-time-ortho-capture")).toBeVisible();
  await expect(page.getByTestId("surface-time-ortho-capture")).toHaveText(
    "Capture",
  );
  await expect(page.getByTestId("surface-time-ortho-copy")).toContainText(
    "Remove the last one",
  );

  await page.getByTestId("surface-time-ortho-add").click();
  await expect(page).toHaveURL(/builder=1/);
  await expect(page.getByTestId("analyzer-positions-list")).toContainText(
    "Position List",
  );
  await expect(page.getByTestId("analyzer-create-position")).toBeVisible();
  await expect(page.getByTestId("analyzer-pos-show-e2e-pos-1")).toBeVisible();
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
  await expect(page.getByTestId("surface-time-ortho-capture")).toBeVisible();

  const downloadWait = page.waitForEvent("download", { timeout: 15_000 }).catch(
    () => null,
  );
  await page.getByTestId("surface-time-ortho-capture").click({ force: true });
  await expect(page.getByTestId("surface-time-ortho-toast")).toBeVisible({
    timeout: 20_000,
  });
  await downloadWait;

  await page.getByTestId("surface-time-ortho-remove-e2e-pos-1").click({
    force: true,
  });

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
