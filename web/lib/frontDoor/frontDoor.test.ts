import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { bucketFromSignals, entryForReferrer, formatPrice } from "./offers";
import type { FrontDoorProduct } from "./offers";
import { bucketFor, decideAdmission } from "./traffic";
import { clearFormDraft, readFormDraft, writeFormDraft, FORM_DRAFT_KEY } from "./formDraft";
import { randomId, sha256HexFallback, UUID_V4 } from "./webCrypto";
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
  assert.match(randomId(), UUID_V4);
}

{
  const previous = globalThis.crypto;
  let fills = 0;
  const httpCrypto = {
    getRandomValues(target: Uint8Array) {
      fills += 1;
      for (let i = 0; i < target.length; i += 1) target[i] = (i * 17) & 255;
      return target;
    },
  };
  Object.defineProperty(globalThis, "crypto", { configurable: true, writable: true, value: httpCrypto });
  try {
    assert.equal("randomUUID" in httpCrypto, false);
    const id = randomId();
    assert.equal(fills, 1);
    assert.match(id, UUID_V4);
    const throwing = {
      randomUUID() {
        throw new TypeError("crypto.randomUUID is not a function");
      },
      getRandomValues(target: Uint8Array) {
        fills += 1;
        target.fill(9);
        return target;
      },
    };
    Object.defineProperty(globalThis, "crypto", { configurable: true, writable: true, value: throwing });
    assert.match(randomId(), UUID_V4);
    assert.equal(fills, 2);
  } finally {
    Object.defineProperty(globalThis, "crypto", { configurable: true, writable: true, value: previous });
  }
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, String(value));
    },
  };
}

{
  const storage = memoryStorage();
  const local = memoryStorage();
  writeFormDraft(
    storage,
    {
      email: "buyer@example.com",
      firstName: "Ada",
      lastName: "Buyer",
      productId: "navigator-annual",
      terms: true,
    },
    "2026-10-12",
  );
  assert.equal(local.getItem(FORM_DRAFT_KEY), null);
  const saved = JSON.parse(storage.getItem(FORM_DRAFT_KEY) || "{}") as Record<string, unknown>;
  assert.deepEqual(Object.keys(saved).sort(), [
    "email",
    "firstName",
    "lastName",
    "productId",
    "terms",
    "termsVersion",
  ]);
  assert.equal(saved.card, undefined);
  const restored = readFormDraft(storage, "2026-10-12");
  assert.deepEqual(restored, {
    email: "buyer@example.com",
    firstName: "Ada",
    lastName: "Buyer",
    productId: "navigator-annual",
    terms: true,
  });
  const stale = readFormDraft(storage, "2026-10-13");
  assert.equal(stale && stale.terms, false);
  assert.equal(stale && stale.email, "buyer@example.com");
  storage.setItem(
    FORM_DRAFT_KEY,
    JSON.stringify({
      email: "buyer@example.com",
      firstName: "Ada",
      lastName: "Buyer",
      productId: "observer",
      terms: true,
      termsVersion: "2026-10-12",
      card: "4242424242424242",
      address: "1 Main",
    }),
  );
  const stripped = readFormDraft(storage, "2026-10-12");
  assert.equal(stripped && "card" in stripped, false);
  assert.equal(stripped && stripped.productId, "observer");
  assert.equal(stripped && stripped.terms, true);
  storage.setItem(FORM_DRAFT_KEY, "{");
  assert.equal(readFormDraft(storage, "2026-10-12"), null);
  clearFormDraft(storage);
  assert.equal(storage.getItem(FORM_DRAFT_KEY), null);
}

console.log("front-door unit checks ok");
