import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

/**
 * LIM7-G — surface at 1280 / 1440 / 1920. One screenshot each.
 */

const evidenceDir = join(
  process.cwd(),
  "../agents/p-options-lab-heatmap-lim/evidence/lim7",
);

const widths = [1280, 1440, 1920] as const;

test("LIM7 surface fit at 1280, 1440, 1920", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app/options-lab/heatmap");
  const tpl = page.getByTestId("heatmap-template");
  await expect(tpl).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("heatmap-view-panel")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator("header h3").first()).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    if ((await tpl.inputValue()) !== "lim") await tpl.selectOption("lim");
    await expect(
      page.getByRole("heading", { name: "GEX lean (window)" }),
    ).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });

  const plane = page.getByTestId("heatmap-lim-quadrant");
  await expect(plane).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("lim-plane")).toBeVisible();
  await expect(page.getByTestId("lim-dot")).toBeVisible();
  await expect(page.getByTestId("lim-chip-proximity")).toBeVisible();
  await expect(page.getByTestId("lim-ring")).toHaveCount(0);
  await expect(page.getByLabel("LIM density")).toHaveCount(0);
  await expect(page.getByTestId("lim-chrome-line-3")).toHaveCount(0);
  await expect(page.getByTestId("lim-chrome-info")).toBeVisible();
  await expect(page.getByTestId("lim-cell-ul")).toContainText("Weight below");
  await expect(page.getByTestId("lim-companion-gex")).toBeVisible();

  const panel = page.getByTestId("heatmap-view-panel");
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await expect(plane).toBeVisible();
    const box = await panel.boundingBox();
    expect(box, `${w} panel box`).toBeTruthy();
    const overflowY = await plane.evaluate((el) => {
      const p = el.closest("[data-testid='heatmap-view-panel']") as HTMLElement | null;
      const body = p?.querySelector(".overflow-auto, .overflow-hidden") as HTMLElement | null;
      const target = (el.parentElement as HTMLElement) || el;
      return {
        planeH: el.getBoundingClientRect().height,
        gexH: (
          el.querySelector("[data-testid='lim-companion-gex']") as HTMLElement | null
        )?.getBoundingClientRect().height ?? 0,
        scroll: target.scrollHeight > target.clientHeight + 2,
      };
    });
    expect(overflowY.planeH, `${w} plane height`).toBeGreaterThan(120);
    await panel.screenshot({
      path: join(evidenceDir, `lim7-${w}.png`),
    });
  }
});
