import { test, expect } from "@playwright/test";

/**
 * Phase E — browser smoke (no live LLM required).
 *
 * Prerequisites: web + API running, LABS_ENV=dev for /api/auth/dev-login.
 *   cd web && npm run test:e2e -- e2e/smoke.spec.ts
 */

test.describe("Member + admin smoke", () => {
  test("public catalog loads", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("body")).toBeVisible();
    // Catalog should render course content or empty-state, not a crash
    await expect(page.locator("main, [data-testid], h1").first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("home hub loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("dev-login then admin shell (no member join header chrome)", async ({
    page,
  }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/courses|\/admin|\//, { timeout: 30_000 });
    await page.goto("/admin");
    await expect(page.getByTestId("admin-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("admin-brand")).toContainText("Admin");
    await expect(page.getByTestId("admin-nav")).toBeVisible();
    // Board link present
    await expect(page.getByRole("link", { name: "Board" })).toBeVisible();
  });

  test("admin board kanban loads", async ({ page }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/courses|\/admin|\//, { timeout: 30_000 });
    await page.goto("/admin/board");
    await expect(page.getByTestId("board-kanban")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("board-columns")).toBeVisible();
    await expect(page.getByTestId("board-col-draft")).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
    // Form or SSO affordances present
    await expect(
      page.locator('input[type="email"], input[name="email"], form').first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
