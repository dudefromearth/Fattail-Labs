import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const shotDir = process.env.FD_SHOT_DIR || "/opt/cursor/artifacts/front-door";
fs.mkdirSync(shotDir, { recursive: true });

const NONE = {
  state: "none",
  view: "buy",
  headline: "Choose how you want to train",
  detail: "Observer is six weeks at $17 a week. No refunds.",
  can_buy: true,
  products: [{ id: "observer" }, { id: "navigator-annual" }, { id: "navigator-lifetime" }],
  nudge: null,
  card_update_url: null,
};

const WOO = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout</title></head>
<body style="font-family:sans-serif;margin:16px">
<main>
<h1>Woo checkout</h1>
<p>Observer · amount from the store</p>
<button id="pay" style="min-height:48px;width:100%;font-size:16px">Pay</button>
</main>
<script>
document.getElementById("pay").onclick = () => {
  location.href = "http://127.0.0.1:3210/front-door/confirm?order_id=FD-1001&product=observer";
};
</script>
</body></html>`;

async function install(page: Page, view: object = NONE) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (!url.includes("/api/front-door/")) {
      await route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
      return;
    }
    if (url.includes("/member-state")) {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(view) });
      return;
    }
    if (url.includes("/handoff")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://fattail.test/checkout/?add-to-cart=1718",
          product_id: "observer",
          issued_at: 1,
          signature: "test",
          state: "none",
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ stored: true, retain_until: "2028-10-12" }),
    });
  });
  await page.route("https://fattail.test/**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: WOO });
  });
}

async function checkout(page: Page, name: string) {
  await page.goto("/front-door/order", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("fd-order-form")).toBeVisible();
  await expect(page.getByTestId("fd-submit")).toBeEnabled({ timeout: 90_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const font = await page.getByTestId("fd-email").evaluate((el) => getComputedStyle(el).fontSize);
  expect(font).toBe("16px");
  const submit = await page.getByTestId("fd-submit").boundingBox();
  expect(submit && submit.height).toBeGreaterThanOrEqual(44);
  expect(submit && submit.width).toBeGreaterThanOrEqual(44);
  const terms = await page.getByTestId("fd-terms").boundingBox();
  expect(terms && terms.height).toBeGreaterThanOrEqual(44);
  await expect(
    page.locator(
      'input[name="address"], input[autocomplete="street-address"], input[name="city"], input[name="postcode"]',
    ),
  ).toHaveCount(0);
  const html = (await page.content()).toLowerCase();
  expect(html).not.toContain("paypal");
  expect(html).not.toContain("stripe");
  await page.screenshot({ path: path.join(shotDir, `${name}-order.png`), fullPage: true });
  await page.getByTestId("fd-email").fill("buyer@example.com");
  await page.getByTestId("fd-first-name").fill("Ada");
  await page.getByTestId("fd-last-name").fill("Buyer");
  await page.getByTestId("fd-product-observer").locator("input").check();
  await page.getByTestId("fd-terms").locator("input").check();
  await page.getByTestId("fd-submit").click();
  await page.waitForURL("**/fattail.test/**");
  await page.screenshot({ path: path.join(shotDir, `${name}-woo.png`) });
  await page.locator("#pay").click();
  await expect(page.getByTestId("fd-success")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("fd-order-id")).toHaveText("FD-1001");
  await page.screenshot({ path: path.join(shotDir, `${name}-confirm.png`), fullPage: true });
  if (name === "pixel-slow-3g") {
    await expect(page.locator("[data-speed=slow]")).toBeVisible();
  }
}

test("checkout completes on this device", async ({ page }, info) => {
  await install(page);
  if (info.project.name === "pixel-slow-3g") {
    await page.route("**/front-door/ping", (route) => route.abort());
    const client = await page.context().newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (500 * 1000) / 8,
      uploadThroughput: (500 * 1000) / 8,
      latency: 400,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  await checkout(page, info.project.name);
});

test("slow connection keeps the video off and still reaches checkout", async ({ page }, info) => {
  test.skip(info.project.name !== "pixel-slow-3g", "slow bucket is the throttled project");
  await install(page);
  await page.route("**/front-door/ping", (route) => route.abort());
  const client = await page.context().newCDPSession(page);
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (500 * 1000) / 8,
    uploadThroughput: (500 * 1000) / 8,
    latency: 400,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/front-door/watch", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-speed=slow]")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("fd-no-video")).toBeVisible();
  await page.screenshot({ path: path.join(shotDir, "pixel-slow-3g-watch.png"), fullPage: true });
});

test("member states, links, and referrer routing", async ({ page }, info) => {
  test.skip(info.project.name !== "pixel", "run the matrix once");
  await install(page, {
    state: "navigator_annual",
    view: "already_covered",
    headline: "You're already covered",
    detail: "Nothing to buy.",
    can_buy: false,
    products: [],
    nudge: {
      title: "Your payment didn't go through",
      body: "Update your card. Access stays while the payment is retried.",
      action: "Update your card",
    },
    card_update_url: "https://fattail.ai/my-account/payment-methods/",
  });
  await page.goto("/front-door/order");
  await expect(page.getByTestId("fd-covered")).toBeVisible();
  await expect(page.getByTestId("fd-nudge")).toBeVisible();
  await expect(page.getByTestId("fd-submit")).toHaveCount(0);
  await expect(page.getByTestId("fd-link-start")).toBeVisible();
  await expect(page.getByTestId("fd-link-watch")).toBeVisible();
  await page.screenshot({ path: path.join(shotDir, "pixel-covered.png"), fullPage: true });

  await page.goto("/front-door", { referer: "https://www.youtube.com/watch?v=abc" });
  await expect(page.locator("[data-entry=watch]")).toBeVisible();
  await page.goto("/front-door", { referer: "https://www.google.com/search?q=fattail" });
  await expect(page.locator("[data-entry=start]")).toBeVisible();
  await page.goto("/front-door/start");
  await expect(page.getByTestId("fd-link-order")).toBeVisible();
  await expect(page.getByTestId("fd-sales-cta")).toBeVisible();
  const cta = await page.getByTestId("fd-sales-cta").boundingBox();
  expect(cta && cta.height).toBeGreaterThanOrEqual(44);
});
