import { defineConfig, devices } from "@playwright/test";

/**
 * Browser validation for the Agent workbench.
 * Requires:
 *   - Next.js app reachable at LABS_WEB_BASE_URL (default http://127.0.0.1:3000)
 *   - API with XAI_API_KEY for live runs
 *   - LABS_ENV=dev (dev-login mint)
 *
 * Skip live assertions when XAI_API_KEY is unset (status panel still checked).
 */
const baseURL = process.env.LABS_WEB_BASE_URL || "http://127.0.0.1:3000";

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
