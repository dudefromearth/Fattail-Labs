import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

/**
 * LIM9-G — diagram at 1280 / 1440 / 1920.
 */

const evidenceDir = join(
  process.cwd(),
  "../agents/p-options-lab-heatmap-lim/evidence/lim9",
);

const widths = [1280, 1440, 1920] as const;

test("LIM9 diagram at 1280, 1440, 1920", async ({ page }) => {
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
  await expect(page.getByTestId("lim-chip-proximity")).toHaveCount(0);
  await expect(page.getByTestId("lim-label-expansion")).toHaveText("EXPANSION");
  await expect(page.getByTestId("lim-label-compression")).toHaveText(
    "COMPRESSION",
  );
  await expect(page.getByTestId("lim-label-weight-below")).toContainText(
    "WEIGHT BELOW",
  );
  await expect(page.getByTestId("lim-label-weight-above")).toContainText(
    "WEIGHT ABOVE",
  );
  await expect(page.getByTestId("lim-cell-ul")).toHaveText("");
  await expect(page.getByTestId("lim-companion-gex")).toBeVisible();
  await expect(page.getByTestId("lim-spot-price")).toBeVisible();

  const panel = page.getByTestId("heatmap-view-panel");
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await expect(plane).toBeVisible();
    await panel.screenshot({
      path: join(evidenceDir, `lim9-${w}.png`),
    });
  }
});
