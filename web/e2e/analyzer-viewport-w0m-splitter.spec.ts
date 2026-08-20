import { writeFileSync, mkdirSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";

/**
 * W0-M — hard refresh vs leave/return splitter.
 * Real mouse drag + wheel. Listed Create 20-wide at spot.
 * Coach path unnamed → analysis §3 A→F listed order.
 */

async function probe(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector(
      '[data-testid="pnl-chart-host"]',
    ) as HTMLElement | null;
    const vp = document.querySelector(
      '[data-testid="analyzer-risk-viewport"]',
    ) as HTMLElement | null;
    if (!host) return { missing: true as const };
    const r = host.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementsFromPoint(x, y)[0] as HTMLElement | undefined;
    return {
      missing: false as const,
      host: {
        w: Math.round(r.width),
        h: Math.round(r.height),
        painted: host.dataset.painted ?? null,
        wheelBound: host.dataset.wheelBound ?? null,
        wheelTicks: host.dataset.wheelTicks ?? null,
        dragTicks: host.dataset.dragTicks ?? null,
        viewX: host.dataset.viewX ?? null,
        pe: getComputedStyle(host).pointerEvents,
      },
      vp: vp
        ? {
            pe: getComputedStyle(vp).pointerEvents,
            vis: getComputedStyle(vp).visibility,
            inert: Boolean((vp as HTMLElement & { inert?: boolean }).inert),
          }
        : null,
      topTestid: top?.getAttribute("data-testid") ?? top?.tagName ?? null,
    };
  });
}

async function realDrag(page: Page) {
  const host = page.getByTestId("pnl-chart-host");
  const box = await host.boundingBox();
  if (!box || box.width < 50 || box.height < 50) {
    return { ok: false as const, reason: "no-box" };
  }
  const x0 = await host.getAttribute("data-view-x");
  const t0 = Number((await host.getAttribute("data-drag-ticks")) || "0");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 80,
    box.y + box.height / 2 + 16,
    { steps: 10 },
  );
  await page.mouse.up();
  const x1 = await host.getAttribute("data-view-x");
  const t1 = Number((await host.getAttribute("data-drag-ticks")) || "0");
  return {
    ok: true as const,
    viewChanged: x0 !== x1,
    ticksGrew: t1 > t0,
    t0,
    t1,
    x0,
    x1,
  };
}

async function realWheel(page: Page) {
  const host = page.getByTestId("pnl-chart-host");
  const box = await host.boundingBox();
  if (!box) return { ok: false as const, reason: "no-box" };
  const x0 = await host.getAttribute("data-view-x");
  const w0 = Number((await host.getAttribute("data-wheel-ticks")) || "0");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 8; i += 1) await page.mouse.wheel(0, 120);
  const x1 = await host.getAttribute("data-view-x");
  const w1 = Number((await host.getAttribute("data-wheel-ticks")) || "0");
  return {
    ok: true as const,
    viewChanged: x0 !== x1,
    ticksGrew: w1 > w0,
    w0,
    w1,
    x0,
    x1,
  };
}

async function waitChartReady(page: Page) {
  await expect(page.getByTestId("pnl-chart-host")).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(async () => (await probe(page)).host?.painted, { timeout: 45_000 })
    .toBe("1");
}

async function gestures(page: Page) {
  const p = await probe(page);
  const drag = await realDrag(page);
  const wheel = await realWheel(page);
  return { probe: p, drag, wheel };
}

test("W0-M splitter A–F listed fly (Coach path unnamed)", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await page.evaluate(() => {
    localStorage.removeItem("ft_options_lab_builder_create_default_v2");
    localStorage.removeItem("ft_options_lab_builder_create_default_v1");
  });
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });

  await page.getByTestId("analyzer-controls-create-position").click();
  const dialog = page.getByTestId("position-builder");
  await expect(dialog).toBeVisible();
  await expect
    .poll(async () => {
      const w = dialog.getByTestId("builder-width");
      const tag = await w.evaluate((el) => el.tagName.toLowerCase());
      if (tag !== "select") return null;
      return w.inputValue();
    }, { timeout: 45_000 })
    .toBe("20");
  await expect
    .poll(async () => {
      const v = Number(await dialog.getByTestId("builder-spot").inputValue());
      return Number.isFinite(v) && v > 0;
    }, { timeout: 45_000 })
    .toBe(true);
  await page.getByTestId("position-builder-analyze").click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });

  await waitChartReady(page);
  const afterCreate = await gestures(page);

  await page.reload();
  await waitChartReady(page);
  const afterHardRefresh = await gestures(page);

  // B — suite Heatmap
  await page
    .getByTestId("options-lab-suite-nav")
    .getByRole("link", { name: "Heatmap" })
    .click();
  await page.waitForURL(/\/app\/options-lab\/heatmap/);
  await page
    .getByTestId("options-lab-suite-nav")
    .getByRole("link", { name: "Analyzer" })
    .click();
  await page.waitForURL(/\/app\/options-lab\/analyzer/);
  await waitChartReady(page);
  const pathB = await gestures(page);

  // C — suite Surface page
  await page
    .getByTestId("options-lab-suite-nav")
    .getByRole("link", { name: "Surface" })
    .click();
  await page.waitForURL(/\/app\/options-lab\/surface/);
  await page
    .getByTestId("options-lab-suite-nav")
    .getByRole("link", { name: "Analyzer" })
    .click();
  await page.waitForURL(/\/app\/options-lab\/analyzer/);
  await waitChartReady(page);
  const pathC = await gestures(page);

  // D — other Labs app
  await page.goto("/app");
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await waitChartReady(page);
  const pathD = await gestures(page);

  // F — Back (bfcache-ish)
  await page
    .getByTestId("options-lab-suite-nav")
    .getByRole("link", { name: "Heatmap" })
    .click();
  await page.waitForURL(/\/app\/options-lab\/heatmap/);
  await page.goBack();
  await page.waitForURL(/\/app\/options-lab\/analyzer/);
  await waitChartReady(page);
  const pathF = await gestures(page);

  const report = {
    afterCreate,
    afterHardRefresh,
    pathB_heatmap: pathB,
    pathC_surfacePage: pathC,
    pathD_apps: pathD,
    pathF_goBack: pathF,
    pathE_browserTab: "not simulated (visibilitychange ≠ real tab)",
  };
  mkdirSync("test-results", { recursive: true });
  writeFileSync(
    "test-results/analyzer-w0m-splitter.json",
    JSON.stringify(report, null, 2),
  );

  const dead = (g: { drag: { viewChanged?: boolean }; wheel: { viewChanged?: boolean } }) =>
    g.drag.viewChanged !== true || g.wheel.viewChanged !== true;

  expect(afterHardRefresh.drag.viewChanged, "hard refresh drag").toBe(true);
  expect(afterHardRefresh.wheel.viewChanged, "hard refresh wheel").toBe(true);

  const failed: string[] = [];
  if (dead(pathA)) failed.push("A");
  if (dead(pathB)) failed.push("B");
  if (dead(pathC)) failed.push("C");
  if (dead(pathD)) failed.push("D");
  if (dead(pathF)) failed.push("F");

  expect(failed, `splitter dead on ${failed.join(",")}`).toEqual([]);
});
