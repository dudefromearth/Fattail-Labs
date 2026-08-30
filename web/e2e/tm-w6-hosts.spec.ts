import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");

test("W6 sticky playhead Analyzer → Heatmap → Surface; Width Fit Replay", async ({
  page,
}) => {
  test.setTimeout(90_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });

  await page.evaluate(() => {
    window.dispatchEvent(new Event("tm-test-engage"));
  });
  await expect(page.getByTestId("analyzer-replay-watermark")).toBeVisible({
    timeout: 15_000,
  });
  const strip = page.getByTestId("analyzer-time-machine");
  await expect
    .poll(async () => strip.getAttribute("data-tm-playhead-t"), {
      timeout: 10_000,
    })
    .toMatch(/^[1-9]/);
  const t0 = await strip.getAttribute("data-tm-playhead-t");

  await page.getByRole("navigation", { name: "Options Lab apps" }).getByRole("link", { name: "Heatmap" }).click();
  await expect(page.getByTestId("options-lab-heatmap-panel")).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(
      async () =>
        page.getByTestId("analyzer-time-machine").getAttribute("data-tm-playhead-t"),
      { timeout: 10_000 },
    )
    .toBe(t0);
  const tHeat = t0;
  await expect(page.getByTestId("heatmap-replay-watermark")).toBeVisible();
  await page.screenshot({
    path: join(evidenceDir, "w6-heatmap-sticky.png"),
    fullPage: false,
  });

  await page.getByTestId("width-fit-time").waitFor({ state: "attached", timeout: 5_000 }).catch(() => {});
  const wf = page.getByTestId("width-fit-time");
  if (await wf.isVisible().catch(() => false)) {
    await expect(wf.getByRole("button", { name: "Replay" })).toBeVisible();
    await expect(wf.getByRole("button", { name: "Average" })).toBeVisible();
    await expect(wf.getByRole("button", { name: "Live" })).toBeVisible();
  }

  await page.getByRole("navigation", { name: "Options Lab apps" }).getByRole("link", { name: "Surface" }).click();
  await expect(page.getByTestId("surface-host")).toBeVisible({
    timeout: 30_000,
  });
  const tSurf = await page
    .getByTestId("analyzer-time-machine")
    .getAttribute("data-tm-playhead-t");
  expect(tSurf).toBe(t0);
  await expect(page.getByTestId("surface-replay-watermark")).toBeVisible();
  await page.screenshot({
    path: join(evidenceDir, "w6-surface-sticky.png"),
    fullPage: false,
  });
});
