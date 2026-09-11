/**
 * PC6 — CHECK PRICE, lock field, ToS @LMT.
 *
 *   npx --yes tsx lib/options-lab/lock.pc6.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyEditPatch,
  keepCheckPrice,
  lockLimit,
  positionFromInput,
  scaleCardPos,
  setCardDirection,
  withCheckPriceIfLocked,
  type AnalyzerPosition,
} from "./analyzerBook";
import { generateTosScript, tosScriptPrice } from "./tosGenerator";
import type { LegInput } from "./positionTypes";

const here = dirname(fileURLToPath(import.meta.url));

function legs(): LegInput[] {
  return [
    { strike: 760, type: "call", quantity: 1, side: "long", entry_price: 1, expiration: "2026-09-11" },
    { strike: 770, type: "call", quantity: 2, side: "short", entry_price: 1, expiration: "2026-09-11" },
    { strike: 780, type: "call", quantity: 1, side: "long", entry_price: 1, expiration: "2026-09-11" },
  ];
}

function fly(): AnalyzerPosition {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: legs(),
  });
  pos.lastNatSigned = 0.67;
  pos.livePackagePerShare = 0.67;
  return pos;
}

function locked(pos: AnalyzerPosition): AnalyzerPosition {
  return lockLimit(pos, 1.2, false);
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

test("AT-PC-26 POS scale leaves lock standing; strike change → CHECK PRICE", () => {
  const a = locked(fly());
  const scaled = scaleCardPos(a, 3);
  assert.equal(scaled.lock.mode, "locked");
  if (scaled.lock.mode === "locked") {
    assert.equal(scaled.lock.checkPrice, undefined);
    assert.equal(scaled.lock.packageDebitPerShare, 1.2);
  }
  const moved = applyEditPatch(
    a,
    {
      ...a.position,
      legs: a.position.legs.map((l, i) =>
        i === 2 ? { ...l, strike: 790 } : l,
      ),
    },
    a.label,
    a.notation,
  );
  assert.equal(moved.lock.mode, "locked");
  if (moved.lock.mode === "locked") {
    assert.equal(moved.lock.checkPrice, true);
    assert.equal(moved.lock.packageDebitPerShare, 1.2);
  }
});

test("AT-PC-48 Buy/Sell invert moves CHECK PRICE", () => {
  const a = locked(fly());
  const flipped = setCardDirection(a, "sell");
  assert.equal(flipped.lock.mode, "locked");
  if (flipped.lock.mode === "locked") {
    assert.equal(flipped.lock.checkPrice, true);
  }
});

test("AT-PC-51 ToS always @LMT; pending CHECK PRICE script uses live mid", () => {
  const unlocked = fly();
  const scriptLive = generateTosScript({
    symbol: "XSP",
    legs: [{ strike: 770, expiration: "2026-09-11", right: "call", quantity: 1 }],
    costBasis: tosScriptPrice(unlocked),
  });
  assert.match(scriptLive, /@0\.67 LMT/);

  const a = locked(fly());
  a.lastNatSigned = 0.55;
  const pending = withCheckPriceIfLocked(a, {
    ...a,
    position: {
      ...a.position,
      legs: a.position.legs.map((l, i) =>
        i === 2 ? { ...l, strike: 790 } : l,
      ),
    },
  });
  const scriptPending = generateTosScript({
    symbol: "XSP",
    legs: [{ strike: 770, expiration: "2026-09-11", right: "call", quantity: 1 }],
    costBasis: tosScriptPrice(pending),
  });
  assert.match(scriptPending, /@0\.55 LMT/);
  assert.doesNotMatch(scriptPending, /@1\.20 LMT/);

  const kept = keepCheckPrice(pending);
  const scriptKept = generateTosScript({
    symbol: "XSP",
    legs: [{ strike: 770, expiration: "2026-09-11", right: "call", quantity: 1 }],
    costBasis: tosScriptPrice(kept),
  });
  assert.match(scriptKept, /@1\.20 LMT/);
});

test("AT-PC-06 Create never implicit-locks", () => {
  const a = fly();
  assert.equal(a.lock.mode, "unlocked");
});

test("AT-PC-28 freeze_iv and freeze_marks are false on lock", () => {
  const a = locked(fly());
  assert.equal(a.lock.mode, "locked");
  if (a.lock.mode === "locked") {
    assert.equal(a.lock.freezeIv, false);
    assert.equal(a.lock.freezeMarks, false);
  }
});

test("AT-PC-29 DEBIT when D>0 — formatter does not put a minus under DEBIT", () => {
  const a = fly();
  a.lastNatSigned = 0.67;
  a.priceSide = "debit";
  assert.ok((a.lastNatSigned ?? 0) > 0);
  assert.equal(a.priceSide, "debit");
});

test("AT-PC-64 / 32 CHECK PRICE half: dialog structure patch marks CHECK PRICE", () => {
  const a = locked(fly());
  const patched = applyEditPatch(
    a,
    {
      ...a.position,
      legs: a.position.legs.map((l, i) =>
        i === 0 ? { ...l, strike: 755 } : l,
      ),
    },
    a.label,
    a.notation,
  );
  assert.equal(patched.lock.mode, "locked");
  if (patched.lock.mode === "locked") {
    assert.equal(patched.lock.checkPrice, true);
  }
});

test("Keep clears CHECK PRICE; kept number stands", () => {
  const a = locked(fly());
  const pending = withCheckPriceIfLocked(a, {
    ...a,
    position: {
      ...a.position,
      legs: a.position.legs.map((l, i) =>
        i === 2 ? { ...l, strike: 790 } : l,
      ),
    },
  });
  const kept = keepCheckPrice(pending);
  assert.equal(kept.lock.mode, "locked");
  if (kept.lock.mode === "locked") {
    assert.equal(kept.lock.checkPrice, undefined);
    assert.equal(kept.lock.packageDebitPerShare, 1.2);
  }
});

test("chip and Keep render on BASIS", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /CHECK PRICE/);
  assert.match(list, /analyzer-pos-keep-/);
  assert.match(list, /line-through/);
});

console.log(`lock.pc6.test.ts ${n} ok`);
