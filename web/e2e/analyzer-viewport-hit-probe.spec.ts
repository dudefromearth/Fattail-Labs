import { writeFileSync, mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const POS_KEY = "ft_options_lab_analyzer_positions_v2";

const seedPos = {
  id: "e2e-vp-1",
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

async function probe(page: import("@playwright/test").Page) {
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
    const stack = document.elementsFromPoint(x, y).slice(0, 10).map((el) => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        testid: el.getAttribute("data-testid"),
        pe: cs.pointerEvents,
        vis: cs.visibility,
        zi: cs.zIndex,
        cls: String((el as HTMLElement).className || "").slice(0, 90),
      };
    });
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
      top: stack[0] ?? null,
      stack,
    };
  });
}

async function realDrag(page: import("@playwright/test").Page) {
  const host = page.getByTestId("pnl-chart-host");
  const box = await host.boundingBox();
  if (!box) return { ok: false as const, reason: "no-box" };
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
    ticks: { t0, t1 },
    x0,
    x1,
  };
}

async function realWheel(page: import("@playwright/test").Page) {
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
    ticks: { w0, w1 },
    x0,
    x1,
  };
}

test("hit-target after SPA Analyzer return (not hard reload)", async ({
  page,
}) => {
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

  await expect(page.getByTestId("pnl-chart-host")).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(async () => (await probe(page)).host?.painted, { timeout: 20_000 })
    .toBe("1");

  const afterReload = {
    probe: await probe(page),
    drag: await realDrag(page),
    wheel: await realWheel(page),
  };

  await page.getByTestId("options-lab-suite-nav").getByRole("link", { name: "Heatmap" }).click();
  await page.waitForURL(/\/app\/options-lab\/heatmap/);
  await page.getByTestId("options-lab-suite-nav").getByRole("link", { name: "Analyzer" }).click();
  await page.waitForURL(/\/app\/options-lab\/analyzer/);
  await expect(page.getByTestId("pnl-chart-host")).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(async () => (await probe(page)).host?.painted, { timeout: 20_000 })
    .toBe("1");

  const afterSpa = {
    probe: await probe(page),
    drag: await realDrag(page),
    wheel: await realWheel(page),
  };

  const report = {
    afterReload,
    afterSpa,
  };
  mkdirSync("test-results", { recursive: true });
  writeFileSync(
    "test-results/analyzer-hit-probe.json",
    JSON.stringify(report, null, 2),
  );

  expect(afterReload.drag.viewChanged, "reload drag").toBe(true);
  expect(afterSpa.drag.viewChanged, "Heatmap→Analyzer drag").toBe(true);
  expect(afterSpa.wheel.viewChanged, "Heatmap→Analyzer wheel").toBe(true);
});
