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

async function shot(page: Page, file: string, fullPage = false) {
  let last: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const bytes = await page.screenshot({ fullPage, timeout: 20_000, type: "png" });
      fs.writeFileSync(file, bytes);
      return;
    } catch (err) {
      last = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("EAGAIN") || attempt === 3) throw err;
      await page.waitForTimeout(400);
    }
  }
  throw last;
}

async function checkout(page: Page, name: string) {
  await page.goto("/front-door/order", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("fd-order-form")).toBeVisible();
  await expect(page.getByTestId("fd-submit")).toBeEnabled({ timeout: 90_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const email = page.getByTestId("fd-email");
  const font = await email.evaluate((el) => getComputedStyle(el).fontSize);
  expect(font).toBe("16px");
  await expect(email).toHaveAttribute("placeholder", " ");
  await expect(page.locator('label[for="fd-email"]')).toHaveText("Email");
  const emailBox = await email.boundingBox();
  expect(emailBox && emailBox.height).toBeGreaterThanOrEqual(52);
  for (const selector of [".fd-card", ".fd-choice", "[data-testid=fd-terms]", "[data-testid=fd-submit]", ".fd-links a", ".fd-bar"]) {
    const shadow = await page.locator(selector).first().evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe("none");
  }
  if (name === "pixel-slow-3g") {
    await expect(page.locator("[data-speed=slow]")).toBeVisible({ timeout: 90_000 });
    const duration = await page
      .locator(".fd-float label")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0s");
  }
  const submit = await page.getByTestId("fd-submit").boundingBox();
  expect(submit && submit.height).toBeGreaterThanOrEqual(44);
  expect(submit && submit.width).toBeGreaterThanOrEqual(44);
  const terms = await page.getByTestId("fd-terms").boundingBox();
  const card = await page.locator(".fd-card").boundingBox();
  expect(terms && terms.height).toBeGreaterThanOrEqual(48);
  expect(terms && card && terms.width).toBeGreaterThanOrEqual(card.width - 36);
  const mark = await page.getByTestId("fd-terms-mark").boundingBox();
  expect(mark && mark.width).toBeGreaterThanOrEqual(28);
  expect(mark && mark.height).toBeGreaterThanOrEqual(28);
  await expect(page.locator("#fd-terms-box")).toHaveAttribute("type", "checkbox");
  await expect(page.locator("#fd-terms-box")).toHaveAttribute("aria-describedby", "fd-terms-notice");
  await expect(page.locator("#fd-terms-box")).not.toBeChecked();
  await expect(page.getByText("We record this checkout")).toHaveCount(0);
  await expect(page.getByTestId("fd-submit")).toHaveText("Continue to checkout");
  await expect(page.getByTestId("fd-product-navigator-annual")).toContainText("$1,997/year");
  await expect(page.getByTestId("fd-product-navigator-annual")).toContainText(
    "$1,997 per year. A separate purchase from Observer.",
  );
  await expect(page.getByTestId("fd-product-navigator-lifetime")).toContainText(
    "One-time · amount confirmed at checkout",
  );
  await expect(page.getByTestId("fd-product-navigator-lifetime")).toContainText(
    "The amount is confirmed on the secure checkout before you pay.",
  );
  const layout = await page.evaluate(() => {
    const card = document.querySelector(".fd-card");
    const choices = card?.querySelector(":scope > .fd-choices") ?? null;
    const terms = document.querySelector("[data-testid=fd-terms]");
    const email = document.querySelector("#fd-email");
    const first = document.querySelector("#fd-first-name");
    const last = document.querySelector("#fd-last-name");
    if (!card || !choices || !terms || !email || !first || !last) return "missing";
    if (!card.contains(email) || !card.contains(first) || !card.contains(last)) return "fields-outside";
    if (terms.parentElement !== card) return "terms-outside";
    let node: ChildNode | null = choices.nextSibling;
    while (node && node !== terms) {
      if (node.nodeType === Node.ELEMENT_NODE) return "element-between";
      if (node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim()) return "text-between";
      node = node.nextSibling;
    }
    return node === terms ? "ok" : "terms-not-next";
  });
  expect(layout).toBe("ok");
  await page.getByTestId("fd-link-terms").evaluate((el) => {
    el.addEventListener("click", (event) => event.preventDefault(), { capture: true });
  });
  await page.getByTestId("fd-link-privacy").evaluate((el) => {
    el.addEventListener("click", (event) => event.preventDefault(), { capture: true });
  });
  await page.getByTestId("fd-link-terms").click();
  await page.getByTestId("fd-link-privacy").click();
  await expect(page.locator("#fd-terms-box")).not.toBeChecked();
  for (const id of ["fd-link-terms", "fd-footer-terms"]) {
    const link = page.getByTestId(id);
    await expect(link).toHaveAttribute("href", "https://fattail.ai/terms/");
    await expect(link).toHaveAttribute("target", "_blank");
    const box = await link.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
    expect(box && box.width).toBeGreaterThanOrEqual(44);
  }
  for (const id of ["fd-link-privacy", "fd-footer-privacy"]) {
    const link = page.getByTestId(id);
    await expect(link).toHaveAttribute("href", "https://fattail.ai/privacy-policy/");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveText("privacy notice");
    const box = await link.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
    expect(box && box.width).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByTestId("fd-product-observer")).toContainText("$17/week");
  await expect(page.getByTestId("fd-product-observer")).toContainText("Cancel any time. No refunds.");
  await expect(page.getByTestId("fd-product-navigator-annual")).not.toContainText("No refunds");
  await expect(page.getByTestId("fd-product-navigator-lifetime")).not.toContainText("No refunds");
  await expect(page.getByText("Checking membership")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "FatTail Labs" })).toHaveAttribute(
    "src",
    "/brand/fattail-labs-logo.jpg",
  );
  await expect(
    page.locator(
      'input[name="address"], input[autocomplete="street-address"], input[name="city"], input[name="postcode"]',
    ),
  ).toHaveCount(0);
  const html = (await page.content()).toLowerCase();
  expect(html).not.toContain("paypal");
  expect(html).not.toContain("stripe");
  await shot(page, path.join(shotDir, `${name}-order.png`), true);
  await page.getByTestId("fd-email").fill("buyer@example.com");
  await page.getByTestId("fd-first-name").fill("Ada");
  await page.getByTestId("fd-last-name").fill("Buyer");
  await page.getByTestId("fd-product-observer").locator("input").check();
  const selectedShadow = await page
    .getByTestId("fd-product-observer")
    .evaluate((el) => getComputedStyle(el).boxShadow);
  const otherShadow = await page
    .getByTestId("fd-product-navigator-annual")
    .evaluate((el) => getComputedStyle(el).boxShadow);
  expect(selectedShadow).not.toBe("none");
  expect(otherShadow).not.toBe("none");
  expect(selectedShadow).not.toBe(otherShadow);
  await page.getByTestId("fd-terms-mark").click();
  await expect(page.locator("#fd-terms-box")).toBeChecked();
  await page.getByTestId("fd-submit").click();
  await page.waitForURL("**/fattail.test/**");
  await shot(page, path.join(shotDir, `${name}-woo.png`));
  await page.locator("#pay").click();
  await expect(page.getByTestId("fd-success")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("fd-order-id")).toHaveText("FD-1001");
  await shot(page, path.join(shotDir, `${name}-confirm.png`), true);
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
  await shot(page, path.join(shotDir, "pixel-slow-3g-watch.png"), true);
});

test("order form remembers the draft after the video", async ({ page }, info) => {
  test.skip(
    info.project.name !== "iphone" && info.project.name !== "pixel",
    "draft round trip runs on iPhone and Pixel",
  );
  await install(page);
  await page.goto("/front-door/order", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("fd-submit")).toBeEnabled({ timeout: 90_000 });
  await page.getByTestId("fd-email").fill("buyer@example.com");
  await page.getByTestId("fd-first-name").fill("Ada");
  await page.getByTestId("fd-last-name").fill("Buyer");
  await page.getByTestId("fd-product-navigator-annual").locator("input").check();
  await page.getByTestId("fd-terms-mark").click();
  await expect(page.locator("#fd-terms-box")).toBeChecked();
  await expect
    .poll(async () => page.evaluate(() => sessionStorage.getItem("fd_form")))
    .toContain("navigator-annual");
  const stored = await page.evaluate(() => sessionStorage.getItem("fd_form"));
  expect(stored).toContain("buyer@example.com");
  expect(stored).toContain("Ada");
  expect(stored).toContain("Buyer");
  expect(stored && stored.toLowerCase()).not.toContain("card");
  expect(await page.evaluate(() => localStorage.getItem("fd_form"))).toBeNull();
  await expect(async () => {
    await page.goto("/front-door/watch", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-entry=watch]")).toBeVisible({ timeout: 5_000 });
  }).toPass();
  await expect(async () => {
    await page.goto("/front-door/order", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("fd-email")).toHaveValue("buyer@example.com", { timeout: 5_000 });
  }).toPass();
  await expect(page.getByTestId("fd-email")).toHaveValue("buyer@example.com");
  await expect(page.getByTestId("fd-first-name")).toHaveValue("Ada");
  await expect(page.getByTestId("fd-last-name")).toHaveValue("Buyer");
  await expect(page.getByTestId("fd-product-navigator-annual").locator("input")).toBeChecked();
  await expect(page.locator("#fd-terms-box")).toBeChecked();
  await expect(async () => {
    await page.goto("/front-door/confirm?order_id=FD-1001&product=navigator-annual", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("fd-success")).toBeVisible({ timeout: 5_000 });
  }).toPass();
  await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("fd_form"))).toBeNull();
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
  await shot(page, path.join(shotDir, "pixel-covered.png"), true);

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
