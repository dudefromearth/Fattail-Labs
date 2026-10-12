import { defineConfig, devices } from "@playwright/test";

/**
 * Front door only. Does not use the Labs API or a live WooCommerce store.
 * Woo checkout is fulfilled by the spec (fattail.test).
 */
export default defineConfig({
  testDir: "./e2e-front-door",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3210",
  },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 14"] } },
    { name: "pixel", use: { ...devices["Pixel 7"] } },
    { name: "pixel-slow-3g", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx next dev --webpack --hostname 127.0.0.1 --port 3210",
    url: "http://127.0.0.1:3210/front-door/ping",
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3210",
      NEXT_PUBLIC_LABS_API_URL: "http://127.0.0.1:9",
      FRONT_DOOR_TRAFFIC_PERCENT: "100",
    },
  },
});
