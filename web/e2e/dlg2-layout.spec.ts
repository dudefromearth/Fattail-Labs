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
