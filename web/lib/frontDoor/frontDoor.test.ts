import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { bucketFromSignals, entryForReferrer, formatPrice } from "./offers";
import type { FrontDoorProduct } from "./offers";
import { bucketFor, decideAdmission } from "./traffic";
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
  const empty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  assert.equal(sha256HexFallback(""), empty);
  assert.equal(sha256HexFallback("abc"), createHash("sha256").update("abc").digest("hex"));
  assert.match(randomId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}

console.log("front-door unit checks ok");
