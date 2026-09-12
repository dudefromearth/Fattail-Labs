import { test, expect, type Locator, type Page } from "@playwright/test";
import { copyFileSync } from "node:fs";
import { join } from "node:path";

/**
 * DLG2 v0.8 — AT-DLG-21 (no wrap, both themes, larger type) · AT-DLG-22
 * (five additions absent). Also captures gate screenshots.
 */

const OUT = join(
  process.cwd(),
  "../agents/p-options-lab-create-edit-dialog/gate-reports/dlg2",
);

async function openDialog(page: Page) {
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await page.addStyleTag({
    content: `[data-testid="wiki-agent-admin-open"] { display: none !important; }`,
  });
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

async function assertNoWrap(table: Locator) {
  const report = await table.evaluate((el) => {
    const overflow = el.scrollWidth > el.clientWidth + 1;
    const surface = el.closest("[data-testid='builder-legs-surface']");
    const surfaceOverflow = surface
      ? surface.scrollWidth > surface.clientWidth + 1
      : false;
    const wrapped: string[] = [];
    const textLineWraps = (node: Element) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const tops = new Set(
        [...range.getClientRects()]
          .filter((r) => r.width > 0 && r.height > 0)
          .map((r) => Math.round(r.top)),
      );
      return tops.size > 1;
    };
    for (const th of el.querySelectorAll("th")) {
      const text = (th.textContent || "").replace(/\s+/g, " ").trim();
      if (text && textLineWraps(th)) wrapped.push(`th:${text}`);
    }
    for (const td of el.querySelectorAll("td")) {
      const text = (td.textContent || "").replace(/\s+/g, " ").trim();
      if (/^Leg\s+\d+:/.test(text) && textLineWraps(td)) {
        wrapped.push(`label:${text}`);
      }
    }
    return {
      overflow,
      surfaceOverflow,
      wrapped,
      nowrap: getComputedStyle(el).whiteSpace === "nowrap",
    };
  });
  expect(report.nowrap, "table whitespace-nowrap").toBe(true);
  expect(report.overflow, "table horizontal scrollbar").toBe(false);
  expect(report.surfaceOverflow, "surface horizontal scrollbar").toBe(false);
  expect(report.wrapped, "wrapped headers or leg labels").toEqual([]);
}

async function assertMenuMarkers(dialog: Locator, theme: "light" | "dark") {
  const report = await dialog.evaluate((root) => {
    const parse = (c: string) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
    };
    const lum = (rgb: number[]) =>
      (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    const markers = [...root.querySelectorAll("[data-menu-triangle]")];
    const items = markers.map((el) => {
      const style = getComputedStyle(el);
      const poly = el.querySelector("polygon");
      const fill = poly ? getComputedStyle(poly).fill : "";
      const parent = el.parentElement!.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const rgb = parse(fill);
      return {
        pe: style.pointerEvents,
        bottomFlush: Math.abs(rect.bottom - parent.bottom) < 2,
        rightFlush: Math.abs(rect.right - parent.right) < 2,
        fillLum: rgb ? lum(rgb) : null,
      };
    });
    const inTd = (sel: string) =>
      !!root.querySelector(sel)?.closest("td")?.querySelector("[data-menu-triangle]");
    return {
      count: markers.length,
      items,
      qtyHas: inTd('[data-testid="builder-leg-qty-0"]'),
      debitHas: inTd('[data-testid="builder-live-package-price"]'),
      posHas: inTd('[data-testid="builder-pos"]'),
    };
  });
  expect(report.count, "menu fields carry a marker").toBeGreaterThanOrEqual(5);
  expect(report.qtyHas, "QTY is not a menu").toBe(false);
  expect(report.debitHas, "DEBIT is not a menu").toBe(false);
  expect(report.posHas, "POS is not a menu").toBe(false);
  for (const it of report.items) {
    expect(it.pe).toBe("none");
    expect(it.bottomFlush).toBe(true);
    expect(it.rightFlush).toBe(true);
    if (theme === "light") {
      expect(it.fillLum, "not white on a light field").toBeLessThan(0.5);
    } else {
      expect(it.fillLum, "not dark on a dark field").toBeGreaterThan(0.5);
    }
  }
}

test("AT-DLG-21/22 layout vs prototype — both themes, larger type", async ({
  page,
}) => {
  test.setTimeout(120_000);
  copyFileSync(
    join(process.cwd(), "../docs/reference/tos/dialog-target-layout.png"),
    join(OUT, "reference.png"),
  );

  const dialog = await openDialog(page);

  await expect(dialog.getByTestId("builder-center")).toHaveCount(0);
  await expect(dialog.getByTestId("builder-width")).toHaveCount(0);
  await expect(dialog.getByTestId("builder-expiration")).toHaveCount(0);
  await expect(dialog.getByTestId("builder-held-shape")).toHaveCount(0);
  await expect(dialog.getByLabel("Call or Put")).toHaveCount(0);
  await expect(dialog.getByText("Buy Butterfly")).toHaveCount(0);
  await expect(dialog.getByTestId("builder-window-close")).toBeVisible();
  await expect(dialog.getByTestId("builder-legs-header")).toBeVisible();
  const expLabel = await dialog
    .getByTestId("builder-leg-exp-0")
    .evaluate((el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent || "");
  expect(expLabel).toMatch(/[A-Z][a-z]{2} \d{1,2} \d{2}/);

  const widths = await dialog.evaluate((root) => {
    const w = (sel: string) => {
      const el = root.querySelector(sel);
      return el ? el.getBoundingClientRect().width : 0;
    };
    return {
      exp: w('[data-field="expiration"]'),
      strike: w('[data-field="strike"]'),
      debit: w('[data-field="debit"]'),
      pos: w('[data-field="pos"]'),
      qty: w('[data-field="qty"]'),
    };
  });
  expect(widths.exp, "EXPIRATION widest").toBeGreaterThan(widths.strike);
  expect(widths.strike, "STRIKE second").toBeGreaterThan(widths.debit);
  expect(widths.strike).toBeGreaterThan(widths.qty);

  const table = dialog.getByTestId("builder-legs-table");
  await expect(table).toBeVisible();
  await assertNoWrap(table);

  await expect(dialog).toHaveAttribute("data-panel-width", "1100");
  await page.screenshot({ path: join(OUT, "page.png") });
  await dialog.screenshot({ path: join(OUT, "dialog.png") });

  const script = dialog.getByTestId("builder-tos-script");
  await script.evaluate((el) => {
    el.scrollIntoView({ block: "end" });
    const scroller = el.closest(".overflow-y-auto");
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
  await dialog.screenshot({ path: join(OUT, "dialog-script.png") });

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await assertNoWrap(table);
  await dialog.screenshot({ path: join(OUT, "dialog-dark.png") });

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.setAttribute("data-font-size", "larger");
  });
  await assertNoWrap(table);
  await dialog.screenshot({ path: join(OUT, "dialog-light-large.png") });

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.setAttribute("data-font-size", "larger");
  });
  await assertNoWrap(table);
  await dialog.screenshot({ path: join(OUT, "dialog-dark-large.png") });
});

test("AT-DLG-29 menu marker on menu fields, both themes", async ({ page }) => {
  test.setTimeout(90_000);
  const dialog = await openDialog(page);
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });
  await assertMenuMarkers(dialog, "light");
  await dialog.screenshot({ path: join(OUT, "dialog-marker-light.png") });
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await assertMenuMarkers(dialog, "dark");
  await dialog.screenshot({ path: join(OUT, "dialog-marker-dark.png") });
});
