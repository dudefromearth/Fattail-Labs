import { defineConfig, devices } from "@playwright/test";

/**
 * Browser validation.
 * Requires:
 *   - Next.js app reachable at LABS_WEB_BASE_URL (default http://127.0.0.1:3000)
 *   - Practice smoke: LABS_E2E_EMAIL + LABS_E2E_PASSWORD (FatTail.ai membership)
 *   - Agent workbench: XAI_API_KEY; LABS_ENV=dev for /api/auth/dev-login
 *
 * Practice e2e signs in via FatTail.ai WordPress SSO (not Labs-local password).
 */
// Prefer localhost (not 127.0.0.1) so SSO callback cookies match fotw-sso redirect
// (LABS_SSO_LOGIN_URL_* typically points at http://localhost:3000/api/auth/sso/…).
const baseURL = process.env.LABS_WEB_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
});
