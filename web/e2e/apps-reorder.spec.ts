import { test, expect } from "@playwright/test";

/**
 * Apps hub catalog order (Catalog-Order Spec v1.1 / DL-319–320).
 * Reading order: top-left → right → next row; last wraps to first.
 * Prerequisites: web + API running, LABS_ENV=dev for /api/auth/dev-login.
 */

async function cardTitles(page: import("@playwright/test").Page) {
  const cards = page.locator("ul.grid > li");
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  return cards.locator("h2").allInnerTexts();
}

test.describe("Apps hub reorder", () => {
  test("members do not see steppers", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Journey" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /Move .+ left/ })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: /Move .+ right/ })).toHaveCount(
      0,
    );
    await expect(page.getByRole("switch", { name: /Highlight / })).toHaveCount(0);
  });

  test("admin walks reading order across columns and wraps last to first", async ({
    page,
  }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
    await page.goto("/app");
    const cards = page.locator("ul.grid > li");
    const start = (await cardTitles(page)).map((t) => t.trim());
    expect(start.length).toBeGreaterThanOrEqual(3);
    const [a, b, c] = start;
    const last = start[start.length - 1];

    // Top-left → top-right (same row, next column).
    await page.getByRole("button", { name: `Move ${a} right` }).click();
    await expect(cards.nth(0).locator("h2")).toHaveText(b, { timeout: 10_000 });
    await expect(cards.nth(1).locator("h2")).toHaveText(a);

    // Top-right → next row left (changes column).
    await page.getByRole("button", { name: `Move ${a} right` }).click();
    await expect(cards.nth(1).locator("h2")).toHaveText(c, { timeout: 10_000 });
    await expect(cards.nth(2).locator("h2")).toHaveText(a);

    // Restore A to top-left (two lefts).
    await page.getByRole("button", { name: `Move ${a} left` }).click();
    await page.getByRole("button", { name: `Move ${a} left` }).click();
    await expect(cards.nth(0).locator("h2")).toHaveText(a, { timeout: 10_000 });

    // Last cell wraps to top-left.
    await page.getByRole("button", { name: `Move ${last} right` }).click();
    await expect(cards.nth(0).locator("h2")).toHaveText(last, { timeout: 10_000 });
    await expect(cards.nth(1).locator("h2")).toHaveText(a);

    await page.reload();
    await expect(cards.nth(0).locator("h2")).toHaveText(last, { timeout: 30_000 });

    // Unwrap so the suite is not sticky.
    await page.getByRole("button", { name: `Move ${last} left` }).click();
    await expect(cards.nth(0).locator("h2")).toHaveText(a, { timeout: 10_000 });
    await expect(cards.nth((await cards.count()) - 1).locator("h2")).toHaveText(
      last,
    );
  });

  test("admin highlight toggle paints the card and persists", async ({
    page,
  }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
    await page.goto("/app");
    const cards = page.locator("ul.grid > li");
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
    const first = cards.first();
    const title = (await first.locator("h2").innerText()).trim();
    const surface = first.locator("[data-highlighted]").first();
    const wasOn = (await surface.getAttribute("data-highlighted")) === "true";
    const toggle = page.getByRole("switch", { name: `Highlight ${title}` });
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(surface).toHaveAttribute(
      "data-highlighted",
      wasOn ? "false" : "true",
    );

    await page.reload();
    await expect(
      page.locator("ul.grid > li").first().locator("[data-highlighted]"),
    ).toHaveAttribute("data-highlighted", wasOn ? "false" : "true", {
      timeout: 30_000,
    });

    // Restore.
    await page
      .getByRole("switch", { name: `Highlight ${title}` })
      .click();
    await expect(
      page.locator("ul.grid > li").first().locator("[data-highlighted]"),
    ).toHaveAttribute("data-highlighted", wasOn ? "true" : "false");
  });
});
