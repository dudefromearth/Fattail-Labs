import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");

test("W7 rehearsal badge+watermark together; Reset announces disposal", async ({
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
  await expect(page.getByTestId("analyzer-replay-watermark")).toBeVisible();

  await page.evaluate(() => {
    window.dispatchEvent(new Event("tm-test-rehearsal-pos"));
  });
  const badge = page.getByTestId("replay-badge");
  await expect(badge).toBeVisible();
  await expect(page.getByText("Rehearsal", { exact: false }).first()).toBeVisible();
  await expect(page.getByTestId("analyzer-replay-watermark")).toBeVisible();
  await page.screenshot({
    path: join(evidenceDir, "w7-watermark-and-badge.png"),
    fullPage: false,
  });

  await expect(page.getByTestId(/analyzer-pos-send-log-/)).toHaveCount(0);

  await page.getByTestId("analyzer-tm-reset").click();
  await expect(page.getByTestId("analyzer-replay-watermark")).toHaveCount(0);
  await expect(page.getByTestId("analyzer-rehearsal-ended")).toBeVisible();
  await expect(page.getByTestId("replay-badge")).toHaveCount(0);
  await page.screenshot({
    path: join(evidenceDir, "w7-rehearsal-ended.png"),
    fullPage: false,
  });
});
