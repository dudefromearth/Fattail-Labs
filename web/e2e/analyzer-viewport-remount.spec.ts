import { test, expect, type Locator } from "@playwright/test";

/**
 * Packet A follow-on: Risk ↔ Surface remount must paint without Hide/Show,
 * and left-drag / wheel must still move the 2D viewport.
 */

const POS_KEY = "ft_options_lab_analyzer_positions_v2";

const seedPos = {
  id: "e2e-vp-1",
  label: "SPX 20-wide fly",
  notation: "+1 5990C / -2 6010C / +1 6030C",
  status: "ANALYSIS",
  livePackagePerShare: 1.2,
  lastNatSigned: -1.2,
  definedDebitPerShare: -1.2,
  priceSide: "debit",
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

async function canvasPainted(canvas: Locator) {
  return canvas.evaluate((el: HTMLCanvasElement) => {
    const css = el.getBoundingClientRect();
    const w = el.width;
    const h = el.height;
    if (css.width < 200 || css.height < 200) {
      return { ok: false, reason: "css-small", w, h, cssW: css.width, cssH: css.height, painted: 0 };
    }
    if (w < 50 || h < 50) {
      return { ok: false, reason: "bitmap-small", w, h, cssW: css.width, cssH: css.height, painted: 0 };
    }
    const ctx = el.getContext("2d");
    if (!ctx) {
      return { ok: false, reason: "no-ctx", w, h, cssW: css.width, cssH: css.height, painted: 0 };
    }
    const data = ctx.getImageData(
      0,
      0,
      Math.min(w, 400),
      Math.min(h, 200),
    ).data;
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 8) painted += 1;
    }
    return {
      ok: painted > 80,
      reason: painted > 80 ? "ok" : "blank",
      w,
      h,
      cssW: css.width,
      cssH: css.height,
      painted,
    };
  });
}

test("Analyzer 2D still paints and pans after Surface round-trip", async ({
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

  const viewport = page.getByTestId("analyzer-risk-viewport");
  await expect(viewport).toBeVisible({ timeout: 30_000 });
  const canvas = viewport.locator("canvas");
  await expect(canvas).toBeVisible();

  await expect
    .poll(async () => (await canvasPainted(canvas)).ok, { timeout: 45_000 })
    .toBe(true);

  await page.getByRole("link", { name: "Heatmap" }).first().click();
  await page.waitForURL(/\/app\/options-lab\/heatmap/);
  await page.getByRole("link", { name: "Analyzer" }).first().click();
  await page.waitForURL(/\/app\/options-lab\/analyzer/);
  await expect(page.getByTestId("analyzer-risk-viewport")).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(
      async () =>
        (await canvasPainted(page.getByTestId("analyzer-risk-viewport").locator("canvas"))).ok,
      { timeout: 15_000 },
    )
    .toBe(true);

  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  const before = await canvas.screenshot();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 90,
    box!.y + box!.height / 2 + 20,
    { steps: 8 },
  );
  await page.mouse.up();
  const afterDrag = await canvas.screenshot();
  expect(before.equals(afterDrag), "left-drag should pan the bitmap").toBe(
    false,
  );

  const host = page.getByTestId("pnl-chart-host");
  await expect(host).toHaveAttribute("data-wheel-bound", "1");
  await expect(host).toHaveAttribute("data-view-x", /:/);
  const xBefore = await host.getAttribute("data-view-x");
  await host.evaluate((el) => {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 12; i += 1) {
      el.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: 120,
          bubbles: true,
          cancelable: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
        }),
      );
    }
  });
  await expect(host).toHaveAttribute("data-wheel-ticks", /[1-9]/);
  const err = await host.getAttribute("data-wheel-err");
  expect(err, `wheel threw: ${err}`).toBeNull();
  await expect
    .poll(async () => host.getAttribute("data-view-x"), { timeout: 3_000 })
    .not.toBe(xBefore);

  const show = page.getByTestId("analyzer-pos-show-e2e-vp-1");
  if (await show.count()) {
    await show.click();
    await show.click();
    await expect
      .poll(async () => (await canvasPainted(canvas)).ok, { timeout: 10_000 })
      .toBe(true);
    const xHide = await host.getAttribute("data-view-x");
    const ticksBefore = Number((await host.getAttribute("data-drag-ticks")) || "0");
    const box2 = await host.boundingBox();
    expect(box2).toBeTruthy();
    await page.mouse.move(box2!.x + 120, box2!.y + 120);
    await page.mouse.down();
    await page.mouse.move(box2!.x + 220, box2!.y + 140, { steps: 10 });
    await page.mouse.up();
    const ticksAfter = Number((await host.getAttribute("data-drag-ticks")) || "0");
    expect(
      ticksAfter,
      `pointerdown after Hide/Show (ticks ${ticksBefore} → ${ticksAfter})`,
    ).toBeGreaterThan(ticksBefore);
    await expect
      .poll(async () => host.getAttribute("data-view-x"), { timeout: 3_000 })
      .not.toBe(xHide);
  }
});
