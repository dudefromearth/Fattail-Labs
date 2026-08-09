import { test, expect, type Page } from "@playwright/test";

/**
 * Hardening D6 — Practice critical path smoke.
 *
 * **Auth is FatTail.ai WordPress SSO** (same path every member uses):
 *   Continue with FatTail.ai → wp-login.php → fotw-sso → Labs session.
 *
 * Env:
 *   LABS_E2E_EMAIL / LABS_E2E_PASSWORD — FatTail.ai membership credentials
 *   LABS_WEB_BASE_URL — default http://127.0.0.1:3000 (SSO callback target)
 *
 *   cd web && LABS_E2E_EMAIL=… LABS_E2E_PASSWORD=… npm run test:e2e:practice
 */

const FATTAIL_SSO_KEY = "wordpress:fattail";

async function loginViaFatTailAi(page: Page): Promise<void> {
  const email = (process.env.LABS_E2E_EMAIL || "").trim();
  const password = process.env.LABS_E2E_PASSWORD || "";
  test.skip(
    !email || !password,
    "Set LABS_E2E_EMAIL and LABS_E2E_PASSWORD (FatTail.ai membership credentials)",
  );

  // Providers list from Labs (proxied) — includes reauth-wrapped fotw-sso URL
  const prov = await page.request.get("/api/auth/providers");
  expect(prov.ok(), await prov.text()).toBeTruthy();
  const body = (await prov.json()) as { sso?: Record<string, string> };
  const ssoUrl = body.sso?.[FATTAIL_SSO_KEY];
  expect(ssoUrl, "wordpress:fattail SSO URL missing from /api/auth/providers").toBeTruthy();

  // Clear any prior Labs session so we do not stack cookies
  await page.request.post("/api/auth/logout?json=1").catch(() => null);

  await page.goto(ssoUrl!);
  // WordPress core login — use labels (avoid ambiguous CSS matching)
  await expect(
    page.getByRole("heading", { name: /log in/i }),
  ).toBeVisible({ timeout: 30_000 });
  const user = page.getByLabel(/username or email/i);
  const pass = page.getByLabel(/^password$/i);
  await expect(user).toBeVisible({ timeout: 15_000 });
  await user.click();
  await user.fill("");
  await user.fill(email);
  await pass.click();
  await pass.fill("");
  await pass.fill(password);
  // Sanity: never leave password in the username box
  await expect(user).toHaveValue(email);
  await page.getByRole("button", { name: /^log in$/i }).click();

  // fotw-sso → Labs /api/auth/sso/wordpress:fattail → landing
  // Cookie host must match LABS_WEB_BASE_URL (use localhost, not 127.0.0.1).
  await page.waitForURL(
    (url) => {
      const h = url.hostname;
      const p = url.pathname;
      // Failed WP auth stays on login or shows error query
      if (h.includes("fattail.ai") && (p.includes("wp-login") || p.includes("wp-admin"))) {
        return false;
      }
      // Labs host after SSO (local or production)
      if (
        h === "localhost" ||
        h === "127.0.0.1" ||
        h.includes("labs.fattail")
      ) {
        return !p.startsWith("/api/auth/sso"); // past callback redirect
      }
      return false;
    },
    { timeout: 90_000 },
  );

  // Confirm Labs session via browser cookies (page.evaluate, same origin)
  await page.goto("/home");
  const meStatus = await page.evaluate(async () => {
    const r = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!r.ok) return { status: r.status, body: null as unknown };
    return { status: r.status, body: await r.json() };
  });
  expect(meStatus.status, JSON.stringify(meStatus.body)).toBe(200);
  const meBody = meStatus.body as { identity_id?: number };
  expect(Number(meBody.identity_id)).toBeGreaterThan(0);
}

test.describe("Practice suite smoke (FatTail.ai SSO)", () => {
  test("FatTail.ai sign-in → trade-log → playbook → export pack", async ({
    page,
  }) => {
    await loginViaFatTailAi(page);

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
    expect(pack.documents?.capital?.format).toBe("fattail.labs.capital");
  });

  test("FatTail.ai sign-in → reports chrome", async ({ page }) => {
    await loginViaFatTailAi(page);
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
