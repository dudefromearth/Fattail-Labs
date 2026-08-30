import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");

test("Surface watermark on a listed painted tent", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await page.evaluate(() => {
    localStorage.removeItem("ft_options_lab_builder_create_default_v2");
    localStorage.removeItem("ft_options_lab_builder_create_default_v1");
    localStorage.removeItem("ft_options_lab_analyzer_positions_v2");
    sessionStorage.removeItem("ft_options_lab_analyzer_positions_v2");
  });
  await page.reload();
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });

  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Boolean(
              (window as unknown as { __tmListedReady?: boolean })
                .__tmListedReady,
            ),
        ),
      { timeout: 90_000 },
    )
    .toBe(true);

  await page.evaluate(() => {
    window.dispatchEvent(new Event("tm-test-listed-pos"));
  });
  await expect(
    page.locator('[data-testid^="analyzer-pos-card-"]').first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("position-builder")).toHaveCount(0);

  await page
    .getByTestId("options-lab-suite-nav")
    .getByRole("link", { name: "Surface", exact: true })
    .click();
  await expect(page.getByTestId("surface-host")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("surface-law-b")).toBeHidden({
    timeout: 60_000,
  });
  await expect(page.getByTestId("surface-canvas")).toBeVisible();

  await page.evaluate(() => {
    window.dispatchEvent(new Event("tm-test-engage"));
  });
  const mark = page.getByTestId("surface-replay-watermark");
  await expect(mark).toBeVisible();
  await expect(page.getByTestId("surface-law-b")).toHaveCount(0);
  await page.screenshot({
    path: join(evidenceDir, "w3-watermark-surface-hiv.png"),
    fullPage: false,
  });
});
