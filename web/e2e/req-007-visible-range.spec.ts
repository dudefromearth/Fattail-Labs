import { test, expect } from "@playwright/test";

/**
 * REQ-007: fresh authed load draws Visible Range with zero interaction.
 * Pan / timeline events refetch /window. sa-vp-update forces a refetch.
 * Full History mode is gone.
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
        // Real per-tick data now, not an instant fake placeholder — a cold
        // per-day print cache build on StudioOne can legitimately take
        // ~20-25s (see window_bins.py), and the hop client gives it up to
        // 45s before giving up. 60s leaves real margin either way.
        timeout: 60_000,
      })
      .toBeGreaterThan(0);
    await expect
      .poll(async () => Number((await host.getAttribute("data-vp-visible-bars")) || "0"), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
    await expect(page.getByTestId("sa-profile-mode")).toHaveCount(0);
    await expect(page.getByTestId("sa-span-chip")).toHaveCount(0);
    await expect(page.getByTestId("sa-live-flag")).toHaveCount(0);
    expect(windowHits.length).toBeGreaterThan(0);
    expect(rangeHits.length).toBe(0);
  });

  test("sa-vp-update forces a window refetch", async ({ page }) => {
    const windowHits: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/vp/v1/window/")) windowHits.push(req.url());
    });
    await login(page);
    await page.goto("/app/options-lab/volume-profile");
    const host = page.getByTestId("sa-price-chart");
    await expect(host).toBeVisible({ timeout: 45_000 });
    await expect
      .poll(async () => Number((await host.getAttribute("data-vp-bins")) || "0"), {
        // Real per-tick data now, not an instant fake placeholder — a cold
        // per-day print cache build on StudioOne can legitimately take
        // ~20-25s (see window_bins.py), and the hop client gives it up to
        // 45s before giving up. 60s leaves real margin either way.
        timeout: 60_000,
      })
      .toBeGreaterThan(0);
    const before = windowHits.length;
    await host.evaluate((el) => {
      el.dispatchEvent(new Event("sa-vp-update"));
    });
    await expect.poll(() => windowHits.length).toBeGreaterThan(before);
  });
});
