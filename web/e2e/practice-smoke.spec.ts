import { test, expect } from "@playwright/test";

/**
 * Hardening D6 — Practice critical path smoke.
 *
 * Auth (first match wins):
 *   1. LABS_E2E_EMAIL + LABS_E2E_PASSWORD → POST /api/auth/login (e.g. Observer)
 *   2. Else /api/auth/dev-login-practice (dev probe activator identity)
 *
 * Prerequisites: web + API running.
 *   cd web && npm run test:e2e:practice
 *   LABS_E2E_EMAIL=… LABS_E2E_PASSWORD=… npm run test:e2e:practice
 */

async function practiceLogin(page: import("@playwright/test").Page) {
  const email = (process.env.LABS_E2E_EMAIL || "").trim();
  const password = process.env.LABS_E2E_PASSWORD || "";
  if (email && password) {
    const res = await page.request.post("/api/auth/login", {
      data: { email, password },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = await res.json();
    expect(body.identity_id).toBeTruthy();
    // Hydrate browser cookie jar for navigation (request context already has it)
    await page.goto("/app/trade-log");
    return { mode: "password" as const, identityId: body.identity_id };
  }
  await page.goto("/api/auth/dev-login-practice");
  await page.waitForURL(/\/app\/trade-log|\/app|\/home/, { timeout: 30_000 });
  return { mode: "dev-practice" as const, identityId: null };
}

test.describe("Practice suite smoke", () => {
  test("member → trade-log → playbook → export pack", async ({ page }) => {
    await practiceLogin(page);

    await page.goto("/app/trade-log");
    await expect(page.getByTestId("practice-suite-nav")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("practice-context-bar")).toBeVisible();
    await expect(page.getByTestId("practice-chrome-top")).toBeVisible();

    await page.goto("/app/playbook");
    await expect(page.getByTestId("practice-suite-nav")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("practice-context-bar")).toBeVisible();

    const res = await page.request.get("/api/me/export?format=json");
    expect(res.status(), await res.text()).toBe(200);
    const pack = await res.json();
    expect(pack.format).toBe("fattail.labs.member_export");
    expect(pack.surfaces).toEqual(
      expect.arrayContaining([
        "playbook",
        "practice_campaign",
        "trade_log",
        "journal",
        "capital",
      ]),
    );
    expect(pack.documents).toBeTruthy();
    expect(pack.documents.capital?.format).toBe("fattail.labs.capital");
  });

  test("reports loads under practice chrome", async ({ page }) => {
    await practiceLogin(page);
    await page.goto("/app/reports");
    await expect(page.getByTestId("practice-suite-nav")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page
        .locator(
          '[data-testid="reports-dashboard"], [data-testid="practice-context-bar"]',
        )
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
