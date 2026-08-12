/**
 * Iron buy/sell must not be inverted.
 *   npx --yes tsx lib/options-lab/ironCondor.structure.test.ts
 *
 * Buy  = long IC  (buy inners, sell wings) → valley debit
 * Sell = short IC (sell inners, buy wings) → tent credit  = flip(buy)
 */
import { buildListedStructure } from "./listedStructure";
import { flipLegs, ironCondorLegs, ironFlyLegs } from "./positionTemplates";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

const listed: number[] = [];
for (let s = 7600; s <= 7900; s += 5) listed.push(s);

const built = buildListedStructure({
  template: "iron_condor",
  listed,
  preferCenter: 7730,
  preferWidth: 40,
  optionSide: "call",
})!;

// Debit-native long IC (Buy)
const buy = built.legs;
assert(buy[0].type === "call" && buy[0].side === "long", "buy: long call inner");
assert(buy[1].type === "call" && buy[1].side === "short", "buy: short call wing");
assert(buy[2].type === "put" && buy[2].side === "long", "buy: long put inner");
assert(buy[3].type === "put" && buy[3].side === "short", "buy: short put wing");

// What Create does for direction=sell: flipLegs(long) → short IC
const sell = flipLegs(buy);
assert(sell[0].side === "short" && sell[0].type === "call", "sell: short call inner");
assert(sell[1].side === "long" && sell[1].type === "call", "sell: long call wing");
assert(sell[2].side === "short" && sell[2].type === "put", "sell: short put inner");
assert(sell[3].side === "long" && sell[3].type === "put", "sell: long put wing");

// Inners short, wings long (classic short IC)
const sellByStrike = [...sell].sort((a, b) => a.strike - b.strike);
assert(sellByStrike[0].side === "long", "sell lowest = long put wing");
assert(sellByStrike[1].side === "short", "sell put inner short");
assert(sellByStrike[2].side === "short", "sell call inner short");
assert(sellByStrike[3].side === "long", "sell highest = long call wing");

// Template helper matches listedStructure long base
const tmpl = ironCondorLegs(7650, 7690, 7770, 7810);
assert(tmpl[0].side === "long" && tmpl[0].strike === 7770, "helper long call inner");
assert(flipLegs(tmpl)[0].side === "short", "helper sell flips");

// Iron fly same law
const fly = ironFlyLegs(7730, 40);
assert(fly[0].side === "long" && fly[0].strike === 7730, "fly buy body long");
const flySell = flipLegs(fly);
assert(flySell[0].side === "short", "fly sell body short");
assert(flySell[1].side === "long", "fly sell wing long");

// Display: calls above puts
const ordered = [...sell].sort((a, b) => {
  if (a.type !== b.type) return a.type === "call" ? -1 : 1;
  return a.strike - b.strike;
});
assert(ordered[0].type === "call", "display call first");
assert(ordered[2].type === "put", "display put after");

console.log("ok  Buy = long IC debit · Sell = short IC credit (flip)");
console.log(
  "  BUY ",
  buy
    .map((l) => `${l.side === "short" ? "SELL" : "BUY"} ${l.strike}${l.type[0].toUpperCase()}`)
    .join(" / "),
);
console.log(
  "  SELL",
  sell
    .map((l) => `${l.side === "short" ? "SELL" : "BUY"} ${l.strike}${l.type[0].toUpperCase()}`)
    .join(" / "),
);
