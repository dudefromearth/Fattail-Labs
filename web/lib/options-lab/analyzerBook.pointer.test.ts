/**
 * Position-card pointer doctrine tests (no vitest — run with tsx).
 *
 *   npx --yes tsx lib/options-lab/analyzerBook.pointer.test.ts
 *
 * Market closed is fine: we assert calendar pointer law + OPF mark apply
 * under sessionHeld (last-known / held package).
 */

import {
  applyPackageQuote,
  calendarDteOf,
  cardDefinitionKey,
  cardNeedsMarketTruth,
  cardPointerExpiration,
  cardShowsPackageMark,
  isOptionPointerExpired,
  positionFromInput,
  setCardExpiration,
  type AnalyzerPosition,
} from "./analyzerBook";
import type { PositionInput } from "./positionTypes";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function fly(exp: string, center = 6000, width = 20): PositionInput {
  return {
    underlying: "SPX",
    expiration: exp,
    contracts: 1,
    direction: "buy",
    net_debit_override: null,
    legs: [
      {
        strike: center - width,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1.2,
      },
      {
        strike: center,
        type: "call",
        quantity: 2,
        side: "short",
        entry_price: 5.5,
      },
      {
        strike: center + width,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1.1,
      },
    ],
  };
}

function withMark(
  pos: AnalyzerPosition,
  mag: number,
  side: "debit" | "credit",
  liveState: AnalyzerPosition["liveState"] = "held",
): AnalyzerPosition {
  return {
    ...pos,
    lastNatSigned: side === "debit" ? mag : -mag,
    livePackagePerShare: mag,
    priceSide: side,
    liveState,
  };
}

let passed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

console.log("analyzerBook pointer doctrine");

// --- calendar pointer law (market closed OK) ---
test("past expiration is expired; future is not", () => {
  const now = new Date("2026-08-12T18:00:00Z"); // 14:00 ET — still 8/12
  assert(isOptionPointerExpired("2026-08-11", now), "8/11 past");
  assert(!isOptionPointerExpired("2026-08-12", now), "8/12 live through midnight ET");
  assert(!isOptionPointerExpired("2026-08-13", now), "8/13 still live");
  assert(calendarDteOf("2026-08-13", now) >= 1, "dte >= 1");
  assert(calendarDteOf("2026-08-12", now) === 0, "expiry day dte is 0");
  assert(calendarDteOf("2026-08-11", now) === 0, "past dte floored to 0");
});

test("expiry day stays live through midnight ET; ghost after", () => {
  const afternoon = new Date("2026-08-12T20:00:00-04:00"); // 20:00 ET
  const late = new Date("2026-08-12T23:59:00-04:00");
  const utcMidnightNext = new Date("2026-08-13T00:00:00Z"); // 20:00 ET Aug 12 — still live
  const easternMidnight = new Date("2026-08-13T00:00:00-04:00");
  const afterMidnight = new Date("2026-08-13T00:00:01-04:00");
  assert(!isOptionPointerExpired("2026-08-12", afternoon), "afternoon still current");
  assert(!isOptionPointerExpired("2026-08-12", late), "23:59 ET still current");
  assert(
    !isOptionPointerExpired("2026-08-12", utcMidnightNext),
    "UTC midnight is still Eastern evening — not expired",
  );
  assert(
    isOptionPointerExpired("2026-08-12", easternMidnight),
    "00:00:00 Eastern Time is expired",
  );
  assert(isOptionPointerExpired("2026-08-12", afterMidnight), "after midnight ET expired");
  assert(calendarDteOf("2026-08-12", afternoon) === 0, "0dte all day");
});

test("EXPIRED pointer does not show package mark even if mark present", () => {
  const now = new Date("2026-08-12T18:00:00Z");
  const pos = withMark(positionFromInput(fly("2026-08-11")), 1.25, "debit", "held");
  assert(isOptionPointerExpired(cardPointerExpiration(pos), now), "expired");
  assert(!cardShowsPackageMark(pos, now), "no package on expired pointer");
});

test("non-expired pointer shows held package (market closed)", () => {
  const now = new Date("2026-08-12T22:00:00Z"); // evening, market closed
  const pos = withMark(positionFromInput(fly("2026-08-14")), 1.25, "debit", "held");
  assert(!isOptionPointerExpired(cardPointerExpiration(pos), now), "live pointer");
  assert(cardShowsPackageMark(pos, now), "held mark visible");
});

// --- rebind pointer (EXPIRED → live listed) ---
test("setCardExpiration rebinds legs, unlocks, clears stale mark", () => {
  const now = new Date("2026-08-12T18:00:00Z");
  let pos = withMark(
    positionFromInput(fly("2026-08-11")),
    2.5,
    "credit",
    "held",
  );
  // simulate locked from prior day
  pos = {
    ...pos,
    lock: {
      mode: "locked",
      lockedAt: new Date().toISOString(),
      packageDebitPerShare: -2.5,
      lockSource: "natural_mid",
      freezeIv: false,
      freezeMarks: true,
    },
  };
  assert(isOptionPointerExpired(cardPointerExpiration(pos), now), "was expired");

  const listed = ["2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14"];
  const next = setCardExpiration(pos, "2026-08-14", listed);

  assert(cardPointerExpiration(next) === "2026-08-14", "front exp rebound");
  assert(
    next.position.legs.every((l) => (l.expiration || next.position.expiration) === "2026-08-14"),
    "all legs rebound",
  );
  assert(next.lock.mode === "unlocked", "unlocked for natural re-quote");
  assert(next.lastNatSigned == null, "stale nat cleared");
  assert(next.livePackagePerShare == null, "stale package cleared");
  assert(next.liveState === "not_live", "awaits OPF wake");
  assert(next.position.net_debit_override == null, "limit cleared");
  assert(!isOptionPointerExpired(cardPointerExpiration(next), now), "new pointer live");
});

test("cardDefinitionKey changes when expiration rebinds (triggers re-quote)", () => {
  const a = positionFromInput(fly("2026-08-11"));
  const b = setCardExpiration(a, "2026-08-14", [
    "2026-08-11",
    "2026-08-14",
  ]);
  assert(cardDefinitionKey(a) !== cardDefinitionKey(b), "definition key moves");
  // mark updates must NOT change definition key
  const marked = withMark(b, 1.1, "debit", "held");
  assert(
    cardDefinitionKey(b) === cardDefinitionKey(marked),
    "mark apply does not change definition key",
  );
});

// --- OPF apply wakes card (held session) ---
test("applyPackageQuote under sessionHeld wakes non-expired card", () => {
  const now = new Date("2026-08-12T22:00:00Z");
  let pos = positionFromInput(fly("2026-08-14"));
  pos = setCardExpiration(pos, "2026-08-14", ["2026-08-14"]); // normalize
  // after rebind-style clear
  pos = {
    ...pos,
    lastNatSigned: null,
    livePackagePerShare: null,
    liveState: "not_live",
    lock: { mode: "unlocked" },
  };

  const woken = applyPackageQuote(
    pos,
    {
      complete: true,
      package_debit_per_share: 1.35, // OPF debit
      as_of: "2026-08-12T20:00:00Z",
      generations_used: {
        "2026-08-14": { content_hash: "abc", as_of: "2026-08-12T20:00:00Z" },
      },
    },
    { sessionHeld: true, interestOk: true },
  );

  assert(woken.liveState === "held", "held when market closed");
  assert(woken.livePackagePerShare === 1.35, "package mag");
  assert(woken.priceSide === "debit", "debit side");
  assert(woken.lastNatSigned === 1.35, "nat signed");
  assert(cardShowsPackageMark(woken, now), "card displays mark");
  assert(!isOptionPointerExpired(cardPointerExpiration(woken), now), "pointer live");
});

test("applyPackageQuote incomplete does not invent a mark", () => {
  const pos = positionFromInput(fly("2026-08-14"));
  const next = applyPackageQuote(
    pos,
    { complete: false, error: "no generations" },
    { sessionHeld: true, interestOk: true },
  );
  assert(next.liveState === "incomplete", "incomplete");
  assert(next.livePackagePerShare == null, "no invented mark");
});

test("open session: pre_open quote → live NBBO is market truth", () => {
  let pos = positionFromInput(fly("2026-08-14"));
  pos = applyPackageQuote(
    pos,
    {
      complete: true,
      package_debit_per_share: -16.07,
      mark_mode: "pre_open_held",
      mark_disclaimer: "Theoretical package until the market opens.",
      as_of: "2026-08-12T12:00:00Z",
    },
    { sessionHeld: true, interestOk: true },
  );
  assert(pos.liveState === "held", "pre-open held");
  assert(pos.markMode === "pre_open_held", "pre_open mode");
  assert(cardNeedsMarketTruth(pos), "needs market truth while pre_open");

  // Bell rings — sessionHeld false, OPF returns live NBBO
  pos = applyPackageQuote(
    pos,
    {
      complete: true,
      package_debit_per_share: -15.4,
      mark_mode: "live",
      mark_disclaimer: null,
      as_of: "2026-08-12T13:35:00Z",
    },
    { sessionHeld: false, interestOk: true },
  );
  assert(pos.liveState === "live", "live after open");
  assert(pos.markMode === "live", "live mark mode");
  assert(pos.markDisclaimer == null, "disclaimer cleared");
  assert(!cardNeedsMarketTruth(pos), "no longer needs market truth");
  assert(pos.livePackagePerShare === 15.4, "live package mag");
});

console.log(`\n${passed} tests passed`);
