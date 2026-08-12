/**
 * Proof: Lab Create default is OPF-placeable butterfly with live package economics.
 *
 *   npx --yes tsx lib/options-lab/butterflyDefault.proof.test.ts
 */

import { buildListedStructure } from "./listedStructure";
import { snapToListed } from "./listedStrikes";
import { packageEconomics } from "./packageEconomics";
import {
  isLabDefaultsActive,
  labDefaultForStrategy,
  resolveCreateSeed,
} from "./builderCreateDefault";

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => {
    store.set(k, String(v));
  },
  removeItem: (k) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

console.log("butterfly default OPF presentation proof");

// Empty storage → Lab active
store.clear();
assert(isLabDefaultsActive(), "Lab defaults active");

const seed = resolveCreateSeed("SPX");
assert(seed.template === "butterfly", "template butterfly");
assert(seed.direction === "buy", "buy");
assert(seed.optionSide === "call", "call");
assert(seed.centerOffsetPts === 0, "ATM center");
assert(seed.wingWidth === 20, "SPX wing 20");
assert(seed.contracts === 1, "1 package");

const lab = labDefaultForStrategy("butterfly", "SPX");
assert(/ATM|fly/i.test(lab.blurb), "presentation blurb");
assert(lab.label.length > 0, "label");

// Simulated OPF dual-side listed strikes (5-pt grid)
const listed: number[] = [];
for (let s = 5900; s <= 6100; s += 5) listed.push(s);
const spot = 6012.4;
const atm = snapToListed(spot, listed);
assert(atm === 6010, `ATM snap got ${atm}`);

const built = buildListedStructure({
  template: seed.template,
  listed,
  preferCenter: atm! + seed.centerOffsetPts,
  preferWidth: seed.wingWidth,
  optionSide: seed.optionSide,
});
assert(built != null, "structure on listed grid");
assert(built!.body === 6010, `body ${built!.body}`);
assert(built!.width === 20, `width ${built!.width}`);
assert(built!.legs.length === 3, "3 legs");
const [lo, body, hi] = built!.legs;
assert(lo.side === "long" && lo.quantity === 1 && lo.strike === 5990, "long wing lo");
assert(body.side === "short" && body.quantity === 2 && body.strike === 6010, "short 2 body");
assert(hi.side === "long" && hi.quantity === 1 && hi.strike === 6030, "long wing hi");
assert(lo.type === "call" && body.type === "call" && hi.type === "call", "all calls");

// OPF-style mids → live package (debit-skewed fly for clear DEBIT)
// long wings 50+50, short 2× body @20 → pay 100, receive 40 → DEBIT 60
const mids: Record<string, number> = {
  "call:5990": 50,
  "call:6010": 20,
  "call:6030": 50,
};
const position = {
  underlying: "SPX",
  expiration: "2026-08-14",
  contracts: 1,
  direction: "buy" as const,
  legs: built!.legs.map((l) => ({ ...l, entry_price: 0 })),
  net_debit_override: null,
};
const eco = packageEconomics(position, (_e, strike, type) => {
  const mid = mids[`${type}:${strike}`];
  if (mid == null) return undefined;
  return { mid, bid: mid - 0.5, ask: mid + 0.5 };
});
// long −50 + short +40 + long −50 = −60 → DEBIT 60
assert(eco.complete, "package complete");
assert(eco.side === "DEBIT", `side ${eco.side}`);
assert(eco.absMid === 60, `absMid ${eco.absMid}`);

console.log("  structure", {
  body: built!.body,
  width: built!.width,
  legs: built!.legs.map(
    (l) => `${l.side} ${l.quantity} ${l.type} ${l.strike}`,
  ),
});
console.log("  package", { side: eco.side, absMid: eco.absMid, complete: eco.complete });
console.log("\nPASS — Lab butterfly is auto-fillable on OPF grid with live package");
