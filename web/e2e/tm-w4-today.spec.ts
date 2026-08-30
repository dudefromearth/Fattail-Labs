import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");

function todayNy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

test("W4 today pre-selected, no Record, no 1x, Reset exits", async ({
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

  const day = page.getByTestId("analyzer-tm-day");
  await expect(day).toHaveValue(todayNy());
  await expect(page.getByTestId("analyzer-tm-speed-10")).toBeVisible();
  await expect(page.getByTestId("analyzer-tm-speed-20")).toBeVisible();
  await expect(page.getByTestId("analyzer-tm-speed-50")).toBeVisible();
  await expect(page.getByTestId("analyzer-tm-speed-1")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Record$/i })).toHaveCount(0);

  await expect(page.getByTestId("analyzer-replay-watermark")).toHaveCount(0);

  await page.evaluate(() => {
    window.dispatchEvent(new Event("tm-test-engage"));
  });
  await expect(page.getByTestId("analyzer-replay-watermark")).toBeVisible();
  await expect(page.getByTestId("analyzer-day-replay-hud")).toBeVisible();
  await page.screenshot({
    path: join(evidenceDir, "w4-today-replay.png"),
    fullPage: false,
  });

  await page.getByTestId("analyzer-tm-reset").click();
  await expect(page.getByTestId("analyzer-replay-watermark")).toHaveCount(0);
  await expect(page.getByTestId("analyzer-day-replay-hud")).toHaveCount(0);
  await expect(day).toHaveValue(todayNy());
  await page.screenshot({
    path: join(evidenceDir, "w4-reset-exits.png"),
    fullPage: false,
  });
});
