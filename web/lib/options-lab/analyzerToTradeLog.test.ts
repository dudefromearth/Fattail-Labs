/**
 * PC9b — promotion mapper. No schema. Snapshot deferred.
 *
 *   npx --yes tsx lib/options-lab/analyzerToTradeLog.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  lockLimit,
  lockNatural,
  positionFromInput,
  type AnalyzerPosition,
} from "./analyzerBook";
import { tosScriptPrice } from "./tosGenerator";
import {
  analyzerPositionToOpenTrade,
  canPromoteToTradeLog,
  orderTypeFromLock,
  strategyCodeFromPosition,
} from "./analyzerToTradeLog";

const here = dirname(fileURLToPath(import.meta.url));

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

function vertical(): AnalyzerPosition {
  return positionFromInput({
    underlying: "SPY",
    expiration: "2026-08-21",
    contracts: 1,
    direction: "sell",
    legs: [
      { strike: 500, type: "put", quantity: 2, side: "short", entry_price: 1.2 },
      { strike: 490, type: "put", quantity: 2, side: "long", entry_price: 0.4 },
    ],
  });
}

function fly(): AnalyzerPosition {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: 760, type: "call", quantity: 1, side: "long", entry_price: 1.1, expiration: "2026-09-11" },
      { strike: 770, type: "call", quantity: 2, side: "short", entry_price: 0.8, expiration: "2026-09-11" },
      { strike: 780, type: "call", quantity: 1, side: "long", entry_price: 0.4, expiration: "2026-09-11" },
    ],
  });
  pos.lastNatSigned = 0.67;
  pos.livePackagePerShare = 0.67;
  return pos;
}

test("strategy from classifier", () => {
  assert.equal(strategyCodeFromPosition(vertical()), "VERTICAL");
  assert.equal(strategyCodeFromPosition(fly()), "BUTTERFLY");
});

test("AT-PC-46 order_type from lockSource; natural mid is not a limit", () => {
  const unlocked = fly();
  assert.equal(orderTypeFromLock(unlocked.lock), "MKT");
  const draftU = analyzerPositionToOpenTrade(unlocked);
  assert.equal(draftU.order_type, "MKT");
  assert.notEqual(draftU.order_type, "LMT");

  const nat = lockNatural(fly());
  assert.equal(nat.lock.mode, "locked");
  if (nat.lock.mode === "locked") {
    assert.equal(nat.lock.lockSource, "natural_mid");
  }
  assert.equal(analyzerPositionToOpenTrade(nat).order_type, "MKT");

  const lim = lockLimit(fly(), 1.25, false);
  assert.equal(analyzerPositionToOpenTrade(lim).order_type, "LMT");
});

test("AT-PC-46 no fill from stored entry_price", () => {
  const draft = analyzerPositionToOpenTrade(fly());
  for (const leg of draft.legs) {
    assert.equal(leg.fill_price, 0);
    assert.notEqual(leg.fill_price, 1.1);
  }
});

test("AT-PC-07 lockSource survives promotion", () => {
  const lim = lockLimit(fly(), 1.25, false);
  const draft = analyzerPositionToOpenTrade(lim);
  assert.equal(draft.lock_source, "user_limit");
  const nat = lockNatural(fly());
  assert.equal(analyzerPositionToOpenTrade(nat).lock_source, "natural_mid");
  assert.equal(analyzerPositionToOpenTrade(fly()).lock_source, "unlocked");
});

test("does not treat leftover contracts as a multiplier", () => {
  const pos = fly();
  pos.position.contracts = 3;
  const draft = analyzerPositionToOpenTrade(pos);
  assert.deepEqual(
    draft.legs.map((l) => l.quantity),
    [1, 2, 1],
  );
});

test("AT-PC-54 unlocked Log price equals the script copy at that instant", () => {
  const pos = fly();
  const draft = analyzerPositionToOpenTrade(pos);
  assert.equal(draft.net_price, Math.abs(tosScriptPrice(pos)));
});

test("AT-PC-14 rehearsal never promotes, including after TM ends", () => {
  const pos = fly();
  pos.rehearsal = true;
  assert.equal(canPromoteToTradeLog(pos, false), false);
  assert.equal(canPromoteToTradeLog(pos, true), false);
  pos.rehearsal = false;
  assert.equal(canPromoteToTradeLog(pos, true), false);
  assert.equal(canPromoteToTradeLog(pos, false), true);
});

test("AT-PC-13 tmActive disables Log on the card", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /tmActive/);
  assert.match(list, /analyzer-pos-send-log-/);
  assert.match(list, /disabled=\{tmActive\}/);
  const host = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert.match(host, /canPromoteToTradeLog/);
  assert.match(host, /tm\.tmActive/);
});

test("PC-LIFE-9 residual does not block Log", () => {
  const pos = fly();
  pos.position.expiration = "2026-09-10";
  pos.position.legs = pos.position.legs.map((l) => ({
    ...l,
    expiration: "2026-09-10",
  }));
  assert.equal(canPromoteToTradeLog(pos, false), true);
  const draft = analyzerPositionToOpenTrade(pos);
  assert.equal(draft.legs.length, 3);
});

test("entry time is the Log clock, not a stored fill time", () => {
  const when = new Date("2026-09-11T20:15:00-04:00");
  const draft = analyzerPositionToOpenTrade(fly(), when);
  assert.equal(draft.exec_at, when.toISOString());
});

test("no schema / no snapshot column in this packet", () => {
  const src = readFileSync(join(here, "analyzerToTradeLog.ts"), "utf8");
  assert.doesNotMatch(src, /analyzer_snapshot/);
  assert.doesNotMatch(src, /ALTER TABLE/);
});

console.log(`analyzerToTradeLog.test.ts ${n} ok`);
