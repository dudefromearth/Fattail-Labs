import { test, expect, type APIResponse } from "@playwright/test";

/**
 * Ernie lock 2026-08-28: /app/iki/runner is an admin-only URL plus a redirect
 * for a non-admin. Nav hide is not the gate. Client useEffect is the leak.
 *
 * Prerequisites: web :3000 + API :4000, LABS_ENV=dev (dev-login routes).
 */

const RUNNER = "/app/iki/runner";
const DOOR = "/app/iki/about";

function locationOf(res: APIResponse): string {
  return res.headers()["location"] ?? "";
}

async function assertRedirectOffRunner(res: APIResponse) {
  expect(
    [301, 302, 303, 307, 308],
    `expected redirect, got ${res.status()}`,
  ).toContain(res.status());
  expect(locationOf(res)).toMatch(/\/app\/iki\/about/);
  const body = await res.text();
  expect(body).not.toContain("iki-runner-host");
  expect(body).not.toContain("data-testid=\"iki-runner-host\"");
}

test.describe("IKI Runner admin URL gate", () => {
  test("unauthenticated GET /app/iki/runner redirects to /app/iki/about", async ({
    request,
  }) => {
    const res = await request.get(RUNNER, { maxRedirects: 0 });
    await assertRedirectOffRunner(res);
  });

  test("signed-in non-admin GET /app/iki/runner redirects to /app/iki/about", async ({
    page,
    context,
  }) => {
    await page.goto("/api/auth/dev-login-practice");
    await page.waitForURL(/\/app\/trade-log|\/home|\//, { timeout: 30_000 });

    const me = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me", { credentials: "same-origin" });
      return r.ok ? ((await r.json()) as { role?: string }) : null;
    });
    expect(me?.role).toBeTruthy();
    expect(me?.role).not.toBe("administrator");

    const res = await context.request.get(RUNNER, { maxRedirects: 0 });
    await assertRedirectOffRunner(res);

    await page.goto(RUNNER);
    await expect(page).toHaveURL(new RegExp(`${DOOR.replace(/\//g, "\\/")}`));
    await expect(page.getByTestId("iki-runner-host")).toHaveCount(0);
  });

  test("administrator GET /app/iki/runner loads the Runner workspace", async ({
    page,
  }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/home|\/course|\/admin|\//, { timeout: 30_000 });

    const me = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me", { credentials: "same-origin" });
      return r.ok ? ((await r.json()) as { role?: string }) : null;
    });
    expect(me?.role).toBe("administrator");

    await page.goto(RUNNER);
    await expect(page).toHaveURL(new RegExp(`${RUNNER.replace(/\//g, "\\/")}`));
    await expect(page.getByTestId("iki-runner-host")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("iki-runner-rail")).toBeVisible();
  });
});
