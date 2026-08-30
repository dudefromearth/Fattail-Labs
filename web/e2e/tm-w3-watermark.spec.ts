import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");

function yesterdayNy(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const now = new Date();
  return fmt.format(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

async function assertWatermark(
  page: import("@playwright/test").Page,
  id: string,
) {
  const mark = page.getByTestId(id);
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute("data-replay", "");
  const pe = await mark.evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pe).toBe("none");
  const color = await mark.locator("[data-replay-mark]").evaluate((el) => {
    const c = getComputedStyle(el).color;
    return c;
  });
  expect(color).not.toMatch(/rgb\(\s*0\s*,\s*1[89]\d/);
  expect(color).not.toMatch(/rgb\(\s*3[4-9]\s*,\s*1[89]\d/);
  expect(color.toLowerCase()).not.toContain("34, 197");
  const glow = page.locator('[data-glow="timemachine"]');
  await expect(glow).toHaveCount(0);
}

test("W3 REPLAY watermark on Analyzer, Heatmap, Surface; no TM glow", async ({
  page,
}) => {
  test.setTimeout(120_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  const day = yesterdayNy();
  const dayInput = page.getByTestId("analyzer-tm-day");
  await dayInput.fill(day);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("tm-test-engage"));
  });
  await assertWatermark(page, "analyzer-replay-watermark");
  await page.screenshot({
    path: join(evidenceDir, "w3-watermark-analyzer.png"),
    fullPage: false,
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  const anim = await page
    .getByTestId("analyzer-replay-watermark")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(anim === "none" || anim === "").toBeTruthy();

  await page.getByRole("link", { name: "Heatmap", exact: true }).click();
  await expect(page.getByTestId("options-lab-heatmap-panel")).toBeVisible({
    timeout: 30_000,
  });
  await assertWatermark(page, "heatmap-replay-watermark");
  await page.screenshot({
    path: join(evidenceDir, "w3-watermark-heatmap.png"),
    fullPage: false,
  });

  await page.getByRole("link", { name: "Surface", exact: true }).click();
  await expect(page.getByTestId("surface-host")).toBeVisible({
    timeout: 30_000,
  });
  await assertWatermark(page, "surface-replay-watermark");
  await page.screenshot({
    path: join(evidenceDir, "w3-watermark-surface.png"),
    fullPage: false,
  });
});
