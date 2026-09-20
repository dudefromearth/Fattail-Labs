import { test, expect } from "@playwright/test";

/**
 * REQ-007 phase A / F4: fresh authed load draws Visible Range with
 * zero interaction. Pan follows. Toggle names Full History.
 */

async function login(page: import("@playwright/test").Page) {
  await page.goto("/api/auth/dev-login");
  await page.waitForURL((u) => !u.pathname.includes("dev-login"), {
    timeout: 30_000,
  });
}

test.describe("REQ-007 Visible Range / F4", () => {
  test("fresh load draws profile with zero interaction", async ({ page }) => {
    const windowHits: string[] = [];
    const rangeHits: string[] = [];
    page.on("request", (req) => {
      const u = req.url();
      if (u.includes("/vp/v1/window/")) windowHits.push(u);
      if (u.includes("/vp/v1/range/")) rangeHits.push(u);
    });
    await login(page);
    await page.goto("/app/options-lab/volume-profile");
    const host = page.getByTestId("sa-price-chart");
    await expect(host).toBeVisible({ timeout: 45_000 });
    await expect(host).toHaveAttribute("data-profile-mode", "visible-range");
    await expect
      .poll(async () => Number((await host.getAttribute("data-vp-bins")) || "0"), {
        timeout: 30_000,
      })
      .toBeGreaterThan(0);
    const mode = page.getByTestId("sa-profile-mode");
    await expect(mode).toContainText("Visible Range");
    expect(windowHits.length).toBeGreaterThan(0);
    expect(rangeHits.length).toBe(0);
  });

  test("toggle names Full History", async ({ page }) => {
    await login(page);
    await page.goto("/app/options-lab/volume-profile");
    const mode = page.getByTestId("sa-profile-mode");
    await expect(mode).toContainText("Visible Range", { timeout: 45_000 });
    await mode.click();
    await expect(mode).toContainText("Full History");
    await expect(page.getByTestId("sa-price-chart")).toHaveAttribute(
      "data-profile-mode",
      "full-history",
    );
  });
});
