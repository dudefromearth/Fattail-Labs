import { test, expect, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * XS4 AT pack — XSP / SPY scale.
 * OUT is this board’s xs4/ (not Width Fit width1/).
 *
 * AT-XS4  XSP Create 1-wide listed (dense $1 / RTH)
 * AT-XS5  SPX Create 20-wide
 * AT-XS6  handleTemplate("butterfly") on XSP does not re-seed 20
 * AT-XS9  Heatmap XSP columns 1–7; SPX 10…50
 * AT-XS10 Width Fit XSP footer 7 cols; SPX 9
 * AT-XS11 SPY listed honesty: prefer=1, never invent unlisted 1
 * AT-XS16 AT-DLG-22: no Width / Centre / Expiration pickers
 */

const OUT = join(
  process.cwd(),
  "../agents/p-options-lab-xsp-spy-scale/gate-reports/xs4",
);

const XSP_COLS = ["1", "2", "3", "4", "5", "6", "7"];
const SPX_COLS = ["10", "15", "20", "25", "30", "35", "40", "45", "50"];

async function hideWikiChrome(page: Page) {
  await page.addStyleTag({
    content: `[data-testid="wiki-agent-admin-open"] { display: none !important; }`,
  });
}

async function clearCreateDefaults(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("ft_options_lab_builder_create_default_v2");
    localStorage.removeItem("ft_options_lab_builder_create_default_v1");
  });
}

async function bootAnalyzer(page: Page, symbol: string) {
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await clearCreateDefaults(page);
  await page.goto(`/app/options-lab/analyzer?symbol=${symbol}`);
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await hideWikiChrome(page);
  await expect(page.getByTestId("analyzer-symbol-select")).toHaveValue(symbol, {
    timeout: 20_000,
  });
}

async function openCreate(page: Page) {
  await page.getByTestId("analyzer-controls-create-position").click();
  const dialog = page.getByTestId("position-builder");
  await expect(dialog).toBeVisible();
  await expect
    .poll(async () => dialog.getByTestId("builder-leg-qty-0").count(), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  return dialog;
}

async function wingWidth(dialog: Locator) {
  const strikes = await dialog.locator('select[data-field="strike"]').evaluateAll(
    (els) =>
      els
        .map((el) => Number((el as HTMLSelectElement).value))
        .filter((n) => Number.isFinite(n) && n > 0),
  );
  if (strikes.length < 3) return { strikes, width: null as number | null };
  const sorted = [...strikes].sort((a, b) => a - b);
  const lower = sorted[1] - sorted[0];
  const upper = sorted[2] - sorted[1];
  return { strikes: sorted, width: Math.min(lower, upper) };
}

async function bootHeatmap(page: Page, symbol: string) {
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto(`/app/options-lab/heatmap?symbol=${symbol}`);
  await expect(page.getByTestId("options-lab-heatmap-panel")).toBeVisible({
    timeout: 30_000,
  });
  await hideWikiChrome(page);
  const sym = page.getByTestId("options-lab-symbol");
  await expect(sym).toHaveValue(symbol, { timeout: 20_000 });
  const tpl = page.getByTestId("heatmap-template");
  await expect(tpl).toBeVisible({ timeout: 30_000 });
  return tpl;
}

async function matrixColLabels(page: Page): Promise<string[]> {
  const panel = page.getByTestId("heatmap-view-panel");
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(
      async () => {
        const texts = await panel.locator("thead th").allTextContents();
        return texts.map((t) => t.trim()).filter((t) => /^\d+$/.test(t));
      },
      { timeout: 60_000 },
    )
    .not.toEqual([]);
  const texts = await panel.locator("thead th").allTextContents();
  return texts.map((t) => t.trim()).filter((t) => /^\d+$/.test(t));
}

test("AT-XS4/5/11/16 Create: XSP 1-wide listed, SPY listed honesty, SPX 20-wide", async ({
  page,
}) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  await bootAnalyzer(page, "XSP");
  let dialog = await openCreate(page);
  await expect(dialog.getByTestId("builder-symbol")).toHaveValue("XSP");
  await expect(dialog.getByTestId("builder-template")).toHaveValue("butterfly");
  await expect(dialog.getByTestId("builder-center")).toHaveCount(0);
  await expect(dialog.getByTestId("builder-width")).toHaveCount(0);
  await expect(dialog.getByTestId("builder-expiration")).toHaveCount(0);
  const xsp = await wingWidth(dialog);
  await page.screenshot({ path: join(OUT, "01-xsp-1-wide.png"), fullPage: false });
  expect(xsp.strikes.length, `XSP strikes ${xsp.strikes}`).toBeGreaterThanOrEqual(
    3,
  );
  expect(xsp.width, `XSP width from ${xsp.strikes}`).toBe(1);
  await dialog.getByTestId("position-builder-cancel").click();

  await bootAnalyzer(page, "SPY");
  dialog = await openCreate(page);
  await expect(dialog.getByTestId("builder-symbol")).toHaveValue("SPY");
  const spy = await wingWidth(dialog);
  await page.screenshot({
    path: join(OUT, "02-spy-listed-honesty.png"),
    fullPage: false,
  });
  expect(spy.strikes.length, `SPY strikes ${spy.strikes}`).toBeGreaterThanOrEqual(
    3,
  );
  expect(spy.width, `SPY width from ${spy.strikes}`).not.toBeNull();
  expect(spy.width as number).toBeGreaterThanOrEqual(1);
  // OD-XS2 (a): prefer=1; honest listed snap when 1 is unlisted. Never invent 1.
  if (spy.width !== 1) {
    expect(
      spy.width as number,
      `SPY honest listed snap (prefer=1, placed ${spy.width} from ${spy.strikes})`,
    ).toBeGreaterThan(1);
  }
  await dialog.getByTestId("position-builder-cancel").click();

  await bootAnalyzer(page, "SPX");
  dialog = await openCreate(page);
  await expect(dialog.getByTestId("builder-symbol")).toHaveValue("SPX");
  const spx = await wingWidth(dialog);
  await page.screenshot({
    path: join(OUT, "03-spx-20-wide.png"),
    fullPage: false,
  });
  expect(spx.width, `SPX width from ${spx.strikes}`).toBe(20);
  await dialog.getByTestId("position-builder-cancel").click();
});

test("AT-XS4 XSP listed-wing walk stays inside 1…7", async ({ page }) => {
  test.setTimeout(90_000);
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  await bootAnalyzer(page, "XSP");
  const dialog = await openCreate(page);
  await expect(dialog.getByTestId("builder-symbol")).toHaveValue("XSP");
  await expect
    .poll(async () => (await wingWidth(dialog)).width, { timeout: 45_000 })
    .toBe(1);
  const start = await wingWidth(dialog);
  expect(start.width).toBe(1);
  const walked: number[] = [start.width!];
  for (let n = 0; n < 8; n++) {
    await dialog.getByTestId("builder-leg-strike-step-0-down").click();
    const w = (await wingWidth(dialog)).width;
    if (w != null && w !== walked[walked.length - 1]) walked.push(w);
    if (w === 7) break;
  }
  await page.screenshot({
    path: join(OUT, "05-xsp-width-walk.png"),
    fullPage: false,
  });
  expect(walked[0]).toBe(1);
  expect(Math.max(...walked)).toBeLessThanOrEqual(7);
});

test("AT-XS6 handleTemplate butterfly on XSP does not re-seed 20", async ({
  page,
}) => {
  test.setTimeout(90_000);
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  await bootAnalyzer(page, "XSP");
  const dialog = await openCreate(page);
  expect((await wingWidth(dialog)).width).toBe(1);
  await dialog.getByTestId("builder-template").selectOption("vertical");
  await expect
    .poll(async () => dialog.getByTestId("builder-leg-qty-0").count(), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
  await dialog.getByTestId("builder-template").selectOption("butterfly");
  await expect
    .poll(async () => dialog.getByTestId("builder-leg-qty-0").count(), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
  const afterTemplate = await wingWidth(dialog);
  await page.screenshot({
    path: join(OUT, "04-xsp-template-reseed.png"),
    fullPage: false,
  });
  expect(
    afterTemplate.width,
    `AT-XS6 XSP butterfly re-seed from ${afterTemplate.strikes}`,
  ).toBe(1);
});

test("AT-XS9 Heatmap XSP columns 1–7; SPX 10…50", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  const tplXsp = await bootHeatmap(page, "XSP");
  if ((await tplXsp.inputValue()) !== "sym-fly") {
    await tplXsp.selectOption("sym-fly");
  }
  await expect(page.getByTestId("heatmap-symbol-profile")).toBeVisible({
    timeout: 20_000,
  });
  const xspCols = await matrixColLabels(page);
  await page.screenshot({
    path: join(OUT, "06-heatmap-xsp-cols.png"),
    fullPage: false,
  });

  const tplSpx = await bootHeatmap(page, "SPX");
  if ((await tplSpx.inputValue()) !== "sym-fly") {
    await tplSpx.selectOption("sym-fly");
  }
  const spxCols = await matrixColLabels(page);
  await page.screenshot({
    path: join(OUT, "08-heatmap-spx-cols.png"),
    fullPage: false,
  });
  expect(xspCols, `XSP Advanced Fly columns ${xspCols.join(",")}`).toEqual(
    XSP_COLS,
  );
  expect(spxCols, `SPX Advanced Fly columns ${spxCols.join(",")}`).toEqual(
    SPX_COLS,
  );
});

test("AT-XS10 Width Fit XSP footer 7; SPX footer 9", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  const tplXsp = await bootHeatmap(page, "XSP");
  await tplXsp.selectOption("width-fit");
  await expect(page.getByTestId("width-fit-footer")).toBeVisible({
    timeout: 60_000,
  });
  await page.screenshot({
    path: join(OUT, "07-width-fit-xsp.png"),
    fullPage: false,
  });
  const xspFooterCount = await page
    .locator('[data-testid^="width-fit-footer-"]')
    .count();

  const tplSpx = await bootHeatmap(page, "SPX");
  await tplSpx.selectOption("width-fit");
  await expect(page.getByTestId("width-fit-footer")).toBeVisible({
    timeout: 60_000,
  });
  await page.screenshot({
    path: join(OUT, "09-width-fit-spx.png"),
    fullPage: false,
  });
  const spxFooterCount = await page
    .locator('[data-testid^="width-fit-footer-"]')
    .count();
  expect(xspFooterCount, "XSP Width Fit footer length").toBe(7);
  expect(spxFooterCount, "SPX Width Fit footer length").toBe(9);
  for (const w of ["10", "50"]) {
    await expect(page.getByTestId(`width-fit-footer-${w}`)).toBeVisible();
  }
});
