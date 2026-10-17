import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  bucketFromSignals,
  canonicalCheckoutOrigin,
  canonicalCheckoutProduct,
  checkoutProducts,
  describeProduct,
  entryForReferrer,
  formatPrice,
  memberDisclosure,
  orderRequestPath,
  panelPrice,
  regularPrice,
  salePriceLine,
} from "./offers";
import type { FrontDoorProduct } from "./offers";
import { bucketFor, decideAdmission } from "./traffic";
import { emailAddressProblem, isProperEmail } from "./emailAddress";
import { contactProblem, isNavigatorProduct } from "./contact";
import { randomId, sha256HexFallback } from "./webCrypto";
import type { FrontDoorOffers } from "./offers";

const observer: FrontDoorProduct = {
  id: "observer",
  name: "Observer",
  kind: "subscription",
  role: "core",
  price_cents: 1700,
  price_mode: "listed",
  currency: "usd",
  interval: "week",
  interval_count: 6,
  display_order: 10,
  disclosure: "$17 per week for 6 weeks.",
};

const lifetime: FrontDoorProduct = {
  ...observer,
  id: "navigator-lifetime",
  name: "Navigator Lifetime",
  kind: "one_time",
  price_cents: null,
  price_mode: "confirmed_at_checkout",
  interval: null,
  interval_count: null,
};

{
  assert.equal(formatPrice(observer), "$17/week × 6");
  assert.equal(formatPrice({ ...observer, price_cents: 199700, interval: "year", interval_count: 1 }), "$1,997/year");
  assert.equal(formatPrice({ ...observer, price_cents: 26700, interval: "month", interval_count: 1 }), "$267/month");
  assert.equal(formatPrice(lifetime), "One-time · amount confirmed at checkout");
  const quarterly = {
    ...observer,
    id: "quarterly",
    name: "Quarterly",
    price_cents: null,
    price_mode: "confirmed_at_checkout" as const,
    interval: "month" as const,
    interval_count: 3,
    disclosure: "Optional. Shown only when switched on in config.",
  };
  const monthly = {
    ...observer,
    id: "navigator-monthly",
    name: "Monthly",
    price_cents: 26700,
    interval: "month" as const,
    interval_count: 1,
    display_order: 60,
  };
  assert.equal(panelPrice(quarterly), "The amount is confirmed on the secure checkout before you pay.");
  assert.equal(panelPrice(monthly), "$267/month");
  assert.equal(panelPrice(lifetime), "One-time · amount confirmed at checkout");
  assert.equal(regularPrice(observer), null);
  assert.equal(regularPrice({ ...observer, regular_price_cents: 1700 }), null);
  assert.equal(regularPrice({ ...observer, regular_price_cents: 2700 }), "$27/week × 6");
  assert.equal(salePriceLine(observer), "$17/week × 6");
  assert.equal(salePriceLine({ ...observer, offer_code: " FALL " }), "$17/week × 6 with code FALL");
  assert.equal(memberDisclosure(quarterly), "");
  assert.equal(describeProduct(observer), "Six weeks of practice. It does not become Navigator on its own.");
  assert.equal(canonicalCheckoutProduct("Trial"), "observer");
  assert.equal(canonicalCheckoutProduct("annual"), "navigator-annual");
  assert.equal(canonicalCheckoutProduct("lifetime"), "navigator-lifetime");
  assert.equal(canonicalCheckoutProduct("nope"), "");
  assert.equal(canonicalCheckoutOrigin("QR"), "qr");
  assert.equal(canonicalCheckoutOrigin(""), "website");
  assert.equal(orderRequestPath("email", "navigator-annual"), "/front-door/order?origin=email&product=annual");
  assert.equal(orderRequestPath("nope", "lifetime"), "/front-door/order?origin=website&product=lifetime");
  assert.deepEqual(
    checkoutProducts([lifetime, monthly, observer, quarterly]).map((product) => product.id),
    ["observer", "navigator-monthly", "quarterly", "navigator-lifetime"],
  );
}

{
  assert.equal(entryForReferrer(null), "order");
  assert.equal(entryForReferrer("https://www.google.com/search?q=fattail"), "start");
  assert.equal(entryForReferrer("https://www.youtube.com/watch?v=abc"), "watch");
  assert.equal(entryForReferrer("https://mail.google.com/mail/u/0/"), "order");
  assert.equal(entryForReferrer("https://example.com/fall?utm_medium=email"), "order");
  assert.equal(entryForReferrer("https://example.com/?utm_medium=cpc"), "start");
  assert.equal(entryForReferrer("https://example.com/blog"), "order");
}

{
  assert.equal(bucketFromSignals({ effectiveType: "2g", probeMs: 10 }), "slow");
  assert.equal(bucketFromSignals({ effectiveType: "3g", probeMs: 10 }), "medium");
  assert.equal(bucketFromSignals({ probeMs: null }), "slow");
  assert.equal(bucketFromSignals({ probeMs: 900 }), "slow");
  assert.equal(bucketFromSignals({ probeMs: 400 }), "medium");
  assert.equal(bucketFromSignals({ effectiveType: "4g", rtt: 50, probeMs: 40 }), "fast");
}

{
  const digest = createHash("sha256").update("visitor-stable-key").digest("hex");
  const expected = Number.parseInt(digest.slice(0, 8), 16) % 100;
  assert.equal(bucketFor("visitor-stable-key"), 80);
  assert.equal(expected, 80);
  const offers = {
    feature_flag: true,
    kill_switch: false,
    traffic_percent: 0,
  } as FrontDoorOffers;
  assert.equal(decideAdmission(offers, "visitor-stable-key").admitted, false);
  assert.equal(decideAdmission({ ...offers, traffic_percent: 100 }, null).admitted, true);
  assert.equal(decideAdmission({ ...offers, traffic_percent: 100, kill_switch: true }, "k").admitted, false);
  assert.equal(decideAdmission({ ...offers, traffic_percent: 50 }, "visitor-stable-key").admitted, false);
  assert.equal(decideAdmission({ ...offers, traffic_percent: 90 }, "visitor-stable-key").admitted, true);
}

{
  assert.equal(emailAddressProblem("  Ada@Fattail.AI "), "");
  assert.equal(isProperEmail("ada@fattail.ai"), true);
  assert.equal(isProperEmail("a.b+tag@domain.co.uk"), true);
  assert.match(emailAddressProblem(""), /email address for this order/);
  assert.match(emailAddressProblem("ada"), /complete email address/);
  assert.match(emailAddressProblem("ada@fattail"), /complete email address/);
  assert.match(emailAddressProblem("ada@fattail..ai"), /complete email address/);
  assert.match(emailAddressProblem("ada@example.com"), /^$/);
}

{
  const empty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  assert.equal(sha256HexFallback(""), empty);
  assert.equal(sha256HexFallback("abc"), createHash("sha256").update("abc").digest("hex"));
  assert.match(randomId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}

{
  assert.equal(isNavigatorProduct("observer"), false);
  assert.equal(isNavigatorProduct("navigator-monthly"), true);
  assert.equal(isNavigatorProduct("navigator-lifetime"), true);
  const filled = {
    phone: "(415) 555-0100",
    street: "1 Market",
    city: "San Francisco",
    region: "CA",
    postal: "94105",
    country: "United States",
  };
  assert.equal(contactProblem(filled), "");
  assert.match(contactProblem({ ...filled, phone: "555" }), /at least 10 digits/);
  assert.match(contactProblem({ ...filled, street: " " }), /street address/);
}

console.log("front-door unit checks ok");
