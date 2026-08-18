import { test, expect } from "@playwright/test";

/**
 * Analyzer Controls “Create position” opens Create Position with the Lab seed:
 * 20-wide butterfly at spot, same live OPF dialog as Edit.
 */

test("Controls Create opens 20-wide butterfly at spot", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await page.evaluate(() => {
    localStorage.removeItem("ft_options_lab_builder_create_default_v2");
    localStorage.removeItem("ft_options_lab_builder_create_default_v1");
  });
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });

  const plus = page.getByTestId("analyzer-controls-create-position");
  await expect(plus).toBeVisible();
  await expect(plus).toHaveAttribute("aria-label", "Create position");
  await plus.click();

  const dialog = page.getByTestId("position-builder");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Create Position" })).toBeVisible();
  await expect(dialog.getByTestId("builder-template")).toHaveValue("butterfly");

  const width = dialog.getByTestId("builder-width");
  await expect(width).toBeVisible();
  await expect
    .poll(async () => {
      const tag = await width.evaluate((el) => el.tagName.toLowerCase());
      if (tag !== "select") return null;
      return width.inputValue();
    }, { timeout: 45_000 })
    .toBe("20");

  const spot = dialog.getByTestId("builder-spot");
  await expect
    .poll(async () => {
      const v = Number(await spot.inputValue());
      return Number.isFinite(v) && v > 0;
    }, { timeout: 45_000 })
    .toBe(true);
});
