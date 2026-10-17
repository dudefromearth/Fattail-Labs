import { expect, test, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

async function expectOnPageBackground(control: Locator) {
  await expect(control).toBeVisible();
  const box = await control.boundingBox();
  expect(box && box.height).toBeGreaterThanOrEqual(44);
  const plate = await control.evaluate((node) => {
    const parent = node.parentElement;
    const parentStyle = parent ? getComputedStyle(parent) : null;
    const own = getComputedStyle(node);
    return {
      parentClass: parent?.className ?? "",
      parentBackground: parentStyle?.backgroundColor ?? "",
      parentShadow: parentStyle?.boxShadow ?? "",
      ownBackground: own.backgroundColor,
      inBar: Boolean(node.closest(".fd-bar")),
    };
  });
  expect(plate.inBar).toBe(false);
  expect(plate.parentClass).not.toContain("fd-bar");
  expect(plate.parentBackground === "rgba(0, 0, 0, 0)" || plate.parentBackground === "transparent").toBe(true);
  expect(plate.parentShadow).toBe("none");
  expect(plate.ownBackground).not.toBe("rgba(0, 0, 0, 0)");
}

async function tapBox(link: Locator) {
  return link.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const hit = getComputedStyle(el, "::after");
    const hanging = hit.position === "absolute";
    const hitWidth = hanging ? parseFloat(hit.width) : 0;
    const hitHeight = hanging ? parseFloat(hit.height) : 0;
    return {
      width: Math.max(rect.width, Number.isFinite(hitWidth) ? hitWidth : 0),
      height: Math.max(rect.height, Number.isFinite(hitHeight) ? hitHeight : 0),
    };
  });
}

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
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.screenshot({ path: file, fullPage, timeout: 20_000 });
      return;
    } catch (err) {
      last = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("EAGAIN") || attempt === 2) throw err;
      await page.waitForTimeout(300);
    }
  }
  throw last;
}

async function checkout(page: Page, name: string) {
  await page.goto("/front-door/choose", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("fd-product-panel")).toContainText("Observer Trial");
  await expect(page.getByTestId("fd-product-panel")).toContainText("$17.00");
  await expect(page.getByTestId("fd-product-panel")).toContainText("$17/week for 6 weeks");
  await expect(page.getByTestId("fd-product-panel")).toContainText("You can cancel anytime. No refunds.");
  await page.getByTestId("fd-product-navigator-monthly").click();
  await expect(page.getByTestId("fd-card-navigator")).toContainText("$267.00");
  await expect(page.getByTestId("fd-card-navigator")).not.toContainText("No refunds");
  await page.getByTestId("fd-product-quarterly").click();
  await expect(page.getByTestId("fd-card-navigator")).toContainText("$597.00");
  await expect(page.getByTestId("fd-card-navigator")).toContainText("Save 25%");
  await expect(page.getByTestId("fd-card-navigator")).not.toContainText("Optional.");
  await expect(page.getByTestId("fd-card-navigator")).not.toContainText("No refunds");
  await page.getByTestId("fd-product-navigator-annual").click();
  await expect(page.getByTestId("fd-card-navigator")).toContainText("$1,997.00");
  await expect(page.getByTestId("fd-card-navigator")).not.toContainText("No refunds");
  await page.getByTestId("fd-product-navigator-lifetime").click();
  await expect(page.getByTestId("fd-card-navigator")).toContainText("$3,000.00");
  await expect(page.getByTestId("fd-card-navigator")).not.toContainText("amount confirmed at checkout");
  await expect(page.getByTestId("fd-card-navigator")).not.toContainText("No refunds");
  await page.getByTestId("fd-product-observer").click();
  await page.goto("/front-door/order?origin=website&product=trial", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("fd-order-form")).toBeVisible();
  await expect(page.getByTestId("fd-product-panel")).toHaveCount(0);
  await expect(page.getByTestId("fd-account")).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("fd-payment")).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("fd-username")).toHaveCount(0);
  await expect(page.getByTestId("fd-pay-card")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByTestId("fd-account").click();
  await page.getByTestId("fd-account-create").click();
  const email = page.getByTestId("fd-email");
  const font = await email.evaluate((el) => getComputedStyle(el).fontSize);
  expect(font).toBe("16px");
  await expect(email).toHaveAttribute("placeholder", " ");
  await expect(page.locator('label[for="fd-email"]')).toHaveText("Email");
  const emailBox = await email.boundingBox();
  expect(emailBox && emailBox.height).toBeGreaterThanOrEqual(52);
  const panelShadow = await page.locator(".fd-card").first().evaluate((el) => getComputedStyle(el).boxShadow);
  expect(panelShadow).not.toBe("none");
  if (name === "pixel-slow-3g") {
    await expect(page.locator("[data-speed=slow]")).toBeVisible({ timeout: 90_000 });
    const duration = await page
      .locator(".fd-float label")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0s");
  }
  await expect(page.getByTestId("fd-payment")).toBeDisabled();
  await expect(page.getByTestId("fd-payment")).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("fd-terms")).toHaveCount(0);
  const emailInAccount = await page.getByTestId("fd-email").evaluate((node) =>
    Boolean(node.closest("[data-testid=fd-account-card]")),
  );
  expect(emailInAccount).toBe(true);
  const footerTerms = page.getByTestId("fd-footer-terms");
  await expect(footerTerms).toHaveAttribute("href", "https://fattail.ai/terms/");
  const privacy = page.getByTestId("fd-footer-privacy");
  await expect(privacy).toHaveAttribute("href", "https://fattail.ai/privacy-policy/");
  await expect(privacy).toHaveAttribute("target", "_blank");
  await expect(privacy).toHaveText("privacy notice");
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
  expect(html).not.toContain("stripe");
  await expect(page.getByTestId("fd-pay-card")).toHaveCount(0);
  await page.getByTestId("fd-first-name").fill("Ada");
  await page.getByTestId("fd-last-name").fill("Buyer");
  await page.getByTestId("fd-email").fill("buyer@example.com");
  await page.getByTestId("fd-email-confirm").fill("buyer@example.com");
  await page.getByTestId("fd-account-submit").click();
  await expect(page.getByTestId("fd-signed-in")).toContainText("Ada Buyer");
  await expect(page.getByTestId("fd-payment")).toBeEnabled();
  await page.getByTestId("fd-payment").click();
  await expect(page.getByTestId("fd-terms")).toBeVisible();
  const terms = await page.getByTestId("fd-terms").boundingBox();
  expect(terms && terms.height).toBeGreaterThanOrEqual(60);
  const box = await page.locator("#fd-terms-box").boundingBox();
  expect(box && box.width).toBeGreaterThanOrEqual(36);
  expect(box && box.height).toBeGreaterThanOrEqual(36);
  const sentence = await page.getByTestId("fd-terms").evaluate((row) => {
    const copy = row.querySelector(".fd-check-copy");
    const control = row.querySelector("input");
    if (!copy || !control) return null;
    const style = getComputedStyle(copy);
    return {
      separated: !copy.contains(control),
      display: style.display,
      lineHeight: parseFloat(style.lineHeight),
      controlHeight: control.getBoundingClientRect().height,
    };
  });
  expect(sentence?.separated).toBe(true);
  expect(sentence?.display).toBe("block");
  expect(sentence && sentence.lineHeight).toBeLessThan(sentence.controlHeight);
  await expect(page.locator("#fd-terms-box")).not.toBeChecked();
  await page.getByTestId("fd-link-terms").evaluate((el) => {
    el.addEventListener("click", (event) => event.preventDefault(), { capture: true });
  });
  await page.getByTestId("fd-link-terms").click();
  await expect(page.locator("#fd-terms-box")).not.toBeChecked();
  const termsLink = page.getByTestId("fd-link-terms");
  await expect(termsLink).toHaveAttribute("href", "https://fattail.ai/terms/");
  await expect(termsLink).toHaveAttribute("target", "_blank");
  const termsHit = await tapBox(termsLink);
  expect(termsHit.height).toBeGreaterThanOrEqual(44);
  expect(termsHit.width).toBeGreaterThanOrEqual(44);
  const termsInPayment = await page.getByTestId("fd-terms").evaluate((node) =>
    Boolean(node.closest("[data-testid=fd-payment-card]")),
  );
  expect(termsInPayment).toBe(true);
  const adviceInPayment = await page.getByTestId("fd-not-advice").evaluate((node) =>
    Boolean(node.closest("[data-testid=fd-payment-card]")),
  );
  expect(adviceInPayment).toBe(true);
  await page.locator("#fd-not-advice-box").check();
  await expect(page.getByTestId("fd-pay-card")).toHaveCount(0);
  await page.locator("#fd-terms-box").check();
  await expect(page.getByTestId("fd-pay-card")).toBeVisible();
  await expect(page.getByTestId("fd-pay-paypal")).toBeVisible();
  const card = await page.getByTestId("fd-pay-card").boundingBox();
  expect(card && card.height).toBeGreaterThanOrEqual(44);
  const cardPlate = await page.getByTestId("fd-pay-card").evaluate((node) => {
    const card = node.closest("[data-testid=fd-payment-card]");
    const style = card ? getComputedStyle(card) : null;
    return {
      inside: Boolean(card),
      background: style?.backgroundColor ?? "",
    };
  });
  expect(cardPlate.inside).toBe(true);
  expect(cardPlate.background === "rgba(0, 0, 0, 0)" || cardPlate.background === "transparent").toBe(false);
  await page.getByTestId("fd-pay-card").click();
  await expect(page.getByTestId("fd-pay-card")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("fd-cc-number")).toBeVisible();
  const cardFields = await page.getByTestId("fd-cc-number").evaluate((node) =>
    Boolean(node.closest("[data-testid=fd-payment-card]")),
  );
  expect(cardFields).toBe(true);
  const popupPromise = page.waitForEvent("popup");
  await page.getByTestId("fd-pay-paypal").click();
  const popup = await popupPromise;
  await expect(popup.getByTestId("fd-paypal-popup")).toBeVisible();
  await expect(popup.getByRole("heading", { name: "Observer" })).toBeVisible();
  await expect(page.getByTestId("fd-cc-number")).toHaveCount(0);
  await expect(page.getByTestId("fd-pay-paypal")).toHaveAttribute("aria-pressed", "true");
  await popup.close();
  expect((await page.content()).toLowerCase()).not.toContain("stripe");
  await shot(page, path.join(shotDir, `${name}-order.png`), true);
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
  await expect(page.getByTestId("fd-link-start")).toHaveCount(0);
  await expect(page.getByTestId("fd-link-watch")).toHaveCount(0);
  const weeks = page.getByTestId("fd-weeks-toggle");
  await expect(weeks).toBeVisible();
  await expect(weeks).toHaveAttribute("aria-expanded", "false");
  await weeks.click();
  await expect(page.getByTestId("fd-weeks-body")).toBeVisible();
  await expect(page.getByText("See where capital is leaking.")).toBeVisible();
  await expect(page.getByText("This is a training program in capital preservation.")).toBeVisible();
  await expect(page).toHaveURL(/\/front-door\/order/);
  await shot(page, path.join(shotDir, "pixel-covered.png"), true);

  await page.goto("/front-door", { referer: "https://www.youtube.com/watch?v=abc" });
  await expect(page.locator("[data-entry=watch]")).toBeVisible();
  await expectOnPageBackground(page.getByTestId("fd-watch-cta"));
  await page.goto("/front-door", { referer: "https://www.google.com/search?q=fattail" });
  await expect(page.locator("[data-entry=start]")).toBeVisible();
  await page.goto("/front-door/start");
  await expect(page.getByTestId("fd-link-order")).toBeVisible();
  await expectOnPageBackground(page.getByTestId("fd-sales-cta"));
});
