import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(
  process.cwd(),
  "../agents/p-options-lab-tm-os/evidence",
);

test("TMOS W3 Analyzer / Heatmap / Surface share Time Machine; no Record; no Instant Replay", async ({
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
  await expect(page.getByTestId("analyzer-time-machine")).toBeVisible();
  await expect(page.getByTestId("analyzer-tm-play")).toBeVisible();
  await expect(page.getByTestId("analyzer-tm-reset")).toBeVisible();
  await expect(page.getByText("Instant Replay")).toHaveCount(0);
  await expect(page.getByTestId("analyzer-tm-record")).toHaveCount(0);
  const azToolbar = page.getByTestId("analyzer-viewport-toolbar");
  const azOverflow = await azToolbar.evaluate((el) => getComputedStyle(el).overflowX);
  expect(azOverflow === "visible" || azOverflow === "clip" || azOverflow === "hidden" || azOverflow === "auto" || azOverflow === "scroll").toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: join(evidenceDir, "w3-analyzer-desktop.png"),
    fullPage: false,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: join(evidenceDir, "w3-analyzer-mobile.png"),
    fullPage: false,
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/options-lab/heatmap?symbol=SPX");
  await expect(page.getByTestId("analyzer-time-machine")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Instant Replay")).toHaveCount(0);
  await page.screenshot({
    path: join(evidenceDir, "w3-heatmap-desktop.png"),
    fullPage: false,
  });

  await page.goto("/app/options-lab/surface?symbol=SPX");
  await expect(page.getByTestId("analyzer-time-machine")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Instant Replay")).toHaveCount(0);
  await page.screenshot({
    path: join(evidenceDir, "w3-surface-desktop.png"),
    fullPage: false,
  });
});
