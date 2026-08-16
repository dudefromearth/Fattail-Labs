/**
 * Bind gate tests: exp first, then price; all legs must pass.
 *
 *   npx --yes tsx lib/options-lab/optionBind.test.ts
 */

import {
  applyBindAssessment,
  assessPositionBind,
  bindPackageLabel,
  legNotTradedLabel,
} from "./optionBind";
import { positionFromInput } from "./analyzerBook";
import type { PositionInput } from "./positionTypes";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function fly(exp: string, center = 6000): PositionInput {
  return {
    underlying: "SPX",
    expiration: exp,
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: center - 20, type: "call", quantity: 1, side: "long", entry_price: 0 },
      { strike: center, type: "call", quantity: 2, side: "short", entry_price: 0 },
      { strike: center + 20, type: "call", quantity: 1, side: "long", entry_price: 0 },
    ],
  };
}

let n = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

console.log("optionBind assessPositionBind");

const now = new Date("2026-08-12T22:00:00Z");
const listed = ["2026-08-12", "2026-08-13", "2026-08-14", "2026-08-17"];

test("all legs valid exp+mid → bindable", () => {
  const pos = fly("2026-08-14");
  const mids = new Map([
    ["2026-08-14:5980:call", 1.1],
    ["2026-08-14:6000:call", 5.0],
    ["2026-08-14:6020:call", 1.0],
  ]);
  const r = assessPositionBind(pos, {
    now,
    listedExpirations: listed,
    getContract: (e, s, t) => {
      const m = mids.get(`${e}:${s}:${t}`);
      return m != null ? { mid: m } : undefined;
    },
  });
  assert(r.bindable, "bindable");
  assert(r.failedCount === 0, "no fails");
  assert(r.summary === "bound", "summary");
});

test("expired exp fails before price check", () => {
  const pos = fly("2026-08-11");
  const r = assessPositionBind(pos, {
    now,
    listedExpirations: listed,
    getContract: () => ({ mid: 9.9 }),
  });
  assert(!r.bindable, "not bindable");
  assert(r.legs.every((l) => l.reason === "expired"), "all expired");
  assert(r.legs.every((l) => !l.priceOk), "price not considered ok");
});

test("valid exp but missing mid on one leg → NOT TRADED (▲/▼ case)", () => {
  const pos = fly("2026-08-14");
  const r = assessPositionBind(pos, {
    now,
    listedExpirations: listed,
    getContract: (e, s, t) => {
      if (s === 6000) return undefined; // body missing after strike nudge
      return { mid: 1.5 };
    },
  });
  assert(!r.bindable, "not bindable");
  assert(r.failedCount === 1, "one fail");
  const body = r.legs.find((l) => l.strike === 6000);
  assert(body?.reason === "no_contract", "body no_contract");
  assert(body?.expOk === true, "exp still ok");
  assert(r.summary.startsWith("NOT TRADED"), `summary=${r.summary}`);
  assert(bindPackageLabel(r) === "NOT TRADED", "package label");
  assert(legNotTradedLabel(body?.reason) === "NOT TRADED", "leg label");
});

test("strike past chain edge → NOT TRADED · chain edge", () => {
  const pos = fly("2026-08-14", 6100); // 6080/6100/6120
  const bandStrikes = [5980, 6000, 6020]; // structure is outside
  const r = assessPositionBind(pos, {
    now,
    listedExpirations: listed,
    getContract: () => undefined,
    getStrikeBand: () => ({
      lo: 5980,
      hi: 6020,
      strikes: bandStrikes,
    }),
  });
  assert(!r.bindable, "not bindable");
  assert(r.legs.every((l) => l.reason === "chain_edge"), "chain_edge");
  assert(r.summary.includes("chain edge"), `summary=${r.summary}`);
  assert(bindPackageLabel(r) === "NOT TRADED", "package NOT TRADED");
});

test("valid exp, contract exists but null mid → no_mid", () => {
  const pos = fly("2026-08-14");
  const r = assessPositionBind(pos, {
    now,
    listedExpirations: listed,
    getContract: () => ({ mid: null, bid: null, ask: null }),
  });
  assert(!r.bindable, "not bindable");
  assert(r.legs.every((l) => l.reason === "no_mid"), "no_mid");
});

test("exp not in listed calendar → exp_not_listed", () => {
  const pos = fly("2026-09-30");
  const r = assessPositionBind(pos, {
    now,
    listedExpirations: listed,
    getContract: () => ({ mid: 2 }),
  });
  assert(!r.bindable, "not bindable");
  assert(r.legs.every((l) => l.reason === "exp_not_listed"), "not listed");
});

test("expired bind keeps the defined debit for ghost", () => {
  const pos = {
    ...positionFromInput(fly("2026-08-11")),
    lastNatSigned: 1.25,
    livePackagePerShare: 1.25,
    priceSide: "debit" as const,
  };
  const bind = assessPositionBind(pos.position, {
    now,
    listedExpirations: listed,
    getContract: () => ({ mid: 9.9 }),
  });
  assert(!bind.bindable, "expired not bindable");
  const next = applyBindAssessment(pos, bind);
  assert(next.lastNatSigned === 1.25, "defined debit kept");
  assert(next.livePackagePerShare === 1.25, "magnitude kept");
  assert(next.priceSide === "debit", "side kept");
});

test("without listed calendar, future exp + mid still binds", () => {
  const pos = fly("2026-08-20");
  const r = assessPositionBind(pos, {
    now,
    listedExpirations: null,
    getContract: () => ({ mid: 0.5 }),
  });
  assert(r.bindable, "bindable without listed gate");
});

console.log(`\n${n} tests passed`);
