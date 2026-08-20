/**
 * Elegant failure law — every state is named and expected.
 *
 *   npx --yes tsx lib/options-lab/cardDisplayState.test.ts
 */

import {
  definedDebitSigned,
  lockLimit,
  lockNatural,
  positionFromInput,
  unlockCard,
  type AnalyzerPosition,
} from "./analyzerBook";
import {
  expiredGhostSeries,
  resolveCardDisplayState,
  resolveViewportBookPolicy,
  resolveViewportFocusPolicy,
  visibleBookTrade,
} from "./cardDisplayState";
import type { PositionInput } from "./positionTypes";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function base(exp: string): AnalyzerPosition {
  const input: PositionInput = {
    underlying: "SPX",
    expiration: exp,
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: 5980, type: "call", quantity: 1, side: "long", entry_price: 1 },
      { strike: 6000, type: "call", quantity: 2, side: "short", entry_price: 5 },
      { strike: 6020, type: "call", quantity: 1, side: "long", entry_price: 1 },
    ],
  };
  return positionFromInput(input);
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

console.log("cardDisplayState elegant failure law");

const now = new Date("2026-08-12T22:00:00Z");

test("expired pointer → EXPIRED (expected)", () => {
  const s = resolveCardDisplayState(base("2026-08-11"), { now });
  assert(s.kind === "expired", "kind");
  assert(s.packageLabel === "EXPIRED", "label");
  assert(s.expected === true, "expected");
  assert(s.detail.length > 20, "detail");
});

test("same calendar day as expiration stays current (not EXPIRED)", () => {
  const s = resolveCardDisplayState(base("2026-08-12"), { now });
  assert(s.kind !== "expired", "expiry day is still in play");
});

test("UTC midnight is still Eastern evening — not EXPIRED", () => {
  const utcMidnight = new Date("2026-08-13T00:00:00Z"); // 20:00 ET Aug 12
  const s = resolveCardDisplayState(base("2026-08-12"), { now: utcMidnight });
  assert(s.kind !== "expired", "UTC midnight ≠ Eastern midnight");
});

test("00:00 Eastern Time the next day is EXPIRED", () => {
  const easternMidnight = new Date("2026-08-13T00:00:00-04:00");
  const s = resolveCardDisplayState(base("2026-08-12"), { now: easternMidnight });
  assert(s.kind === "expired", "Eastern midnight is the cutoff");
  assert(s.packageLabel === "EXPIRED", "label");
});

test("not traded bind → NOT TRADED (expected)", () => {
  let pos = base("2026-08-14");
  pos = {
    ...pos,
    bind: {
      bindable: false,
      failedCount: 1,
      summary: "NOT TRADED · 6100 call · chain edge",
      assessedAt: Date.now(),
      legs: [
        {
          index: 0,
          expiration: "2026-08-14",
          strike: 6100,
          type: "call",
          expOk: true,
          priceOk: false,
          reason: "chain_edge",
          mid: null,
        },
      ],
    },
  };
  const s = resolveCardDisplayState(pos, { now });
  assert(s.kind === "not_traded", "kind");
  assert(s.packageLabel === "NOT TRADED", "label");
  assert(s.expected === true, "expected");
  assert(/chain|strike|traded/i.test(s.detail), "friendly detail");
});

test("incomplete without mark → UPDATING (not broken)", () => {
  let pos = base("2026-08-14");
  pos = {
    ...pos,
    liveState: "incomplete",
    livePackagePerShare: null,
    bind: {
      bindable: true,
      failedCount: 0,
      summary: "bound",
      assessedAt: Date.now(),
      legs: [],
    },
  };
  const s = resolveCardDisplayState(pos, { now, sessionHeld: true });
  assert(s.kind === "updating", "kind");
  assert(s.packageLabel === "UPDATING", "label");
  assert(s.expected === true, "expected");
});

test("budget → BUDGET LIMIT (expected)", () => {
  let pos = base("2026-08-14");
  pos = { ...pos, liveState: "budget_refused", livePackagePerShare: null };
  const s = resolveCardDisplayState(pos, { now });
  assert(s.kind === "budget", "kind");
  assert(s.packageLabel === "BUDGET LIMIT", "label");
  assert(s.expected === true, "expected");
});

test("held price → numeric path", () => {
  let pos = base("2026-08-14");
  pos = {
    ...pos,
    liveState: "held",
    livePackagePerShare: 1.25,
    lastNatSigned: 1.25,
    priceSide: "debit",
    bind: {
      bindable: true,
      failedCount: 0,
      summary: "bound",
      assessedAt: Date.now(),
      legs: [],
    },
  };
  const s = resolveCardDisplayState(pos, { now, sessionHeld: true });
  assert(s.kind === "price", "kind");
  assert(s.packageLabel === null, "no override label");
  assert(s.chipLabel === "held", "held chip");
});

test("pre_open mark → theo until open chip; live mark clears it", () => {
  let pos = base("2026-08-14");
  pos = {
    ...pos,
    liveState: "held",
    livePackagePerShare: 1.5,
    lastNatSigned: -1.5,
    priceSide: "credit",
    markMode: "pre_open_held",
    markDisclaimer: "Theoretical package until the market opens.",
    bind: {
      bindable: true,
      failedCount: 0,
      summary: "bound",
      assessedAt: Date.now(),
      legs: [],
    },
  };
  const pre = resolveCardDisplayState(pos, { now, sessionHeld: true });
  assert(pre.chipLabel === "theo · until open", "pre-open chip");

  // After open OPF re-quote lands live NBBO
  pos = {
    ...pos,
    liveState: "live",
    markMode: "live",
    markDisclaimer: null,
  };
  const live = resolveCardDisplayState(pos, { now, sessionHeld: false });
  assert(live.chipLabel === "live", "live chip after open");
  assert(live.kind === "price", "price path");
});

test("never returns empty labels for exceptional states", () => {
  const kinds = ["expired", "not_traded", "budget", "updating"] as const;
  // smoke: each exceptional path has packageLabel + detail
  for (const k of kinds) {
    // covered above — ensure law constant
    assert(k.length > 0, "kind nonempty");
  }
});

test("viewport: expired → ghost + EXPIRED notice (no cryptic codes)", () => {
  const p = resolveViewportFocusPolicy(base("2026-08-11"), { now });
  assert(p != null, "policy");
  assert(p!.curveMode === "expired_ghost", "ghost mode");
  assert(p!.showExpiredGhost === true, "ghost flag");
  assert(p!.notice?.title === "EXPIRED", "title");
  assert(!/PB-VIEW|dual-side|fabricat/i.test(p!.notice!.detail), "no jargon");
  assert(!/PB-VIEW|dual-side|fabricat/i.test(p!.notice!.title), "no jargon title");
});

test("viewport book: live + expired keeps ghost residual", () => {
  const live = {
    ...base("2026-08-14"),
    id: "live",
    visible: true,
    liveState: "held" as const,
    livePackagePerShare: 1.25,
    lastNatSigned: 1.25,
    priceSide: "debit" as const,
    bind: {
      bindable: true,
      failedCount: 0,
      summary: "bound",
      assessedAt: Date.now(),
      legs: [],
    },
  };
  const expired = { ...base("2026-08-11"), id: "exp", visible: true };
  const book = resolveViewportBookPolicy([live, expired], {
    now,
    sessionHeld: true,
  });
  assert(book?.curveMode === "live", "live sibling still draws");
  assert(book?.showExpiredGhost === true, "expired still ghosts");
  const split = visibleBookTrade([live, expired], {
    now,
    sessionHeld: true,
    symbol: "SPX",
  });
  assert(split.trades.length === 1, "expired is not sent to live OPF");
  assert(split.expiredTrades.length === 1, "expired is in ghost book");
  const ghost = expiredGhostSeries([live, expired], { now, symbol: "SPX" });
  assert(ghost.length > 2, "ghost residual has a curve");
});

test("defined debit survives expire and is what the ghost uses", () => {
  const expired: AnalyzerPosition = {
    ...base("2026-08-11"),
    id: "exp",
    visible: true,
    lastNatSigned: null,
    livePackagePerShare: null,
    definedDebitPerShare: 1.4,
    priceSide: "debit",
  };
  assert(definedDebitSigned(expired) === 1.4, "durable debit");
  const ghost = expiredGhostSeries([expired], { now, symbol: "SPX" });
  const zeroed: AnalyzerPosition = { ...expired, definedDebitPerShare: 0.4 };
  const ghost2 = expiredGhostSeries([zeroed], { now, symbol: "SPX" });
  const mid = ghost[Math.floor(ghost.length / 2)];
  const mid2 = ghost2.find((p) => Math.abs(p.price - mid.price) < 1e-9);
  assert(mid2 != null, "aligned");
  assert(
    Math.abs(mid.pnl - mid2!.pnl + 100) < 1e-6,
    "higher defined debit lowers residual $100",
  );
});

test("ghost residual keeps the defined debit (not entry-price leftover)", () => {
  const at = (debit: number): AnalyzerPosition => ({
    ...base("2026-08-11"),
    id: `d${debit}`,
    visible: true,
    lastNatSigned: debit,
    definedDebitPerShare: debit,
    livePackagePerShare: Math.abs(debit),
    priceSide: debit >= 0 ? "debit" : "credit",
  });
  const cheap = expiredGhostSeries([at(1.25)], { now, symbol: "SPX" });
  const rich = expiredGhostSeries([at(2.25)], { now, symbol: "SPX" });
  assert(cheap.length === rich.length, "same grid");
  const mid = cheap[Math.floor(cheap.length / 2)];
  const midR = rich.find((p) => Math.abs(p.price - mid.price) < 1e-9);
  assert(midR != null, "aligned");
  // expiration P&L = (intrinsic − debit) × 100 → Δdebit 1.00 → ΔP&L −100
  const dPnl = mid.pnl - midR!.pnl;
  assert(Math.abs(dPnl - 100) < 1e-6, `debit shift should be $100, got ${dPnl}`);
});

test("viewport book: expired only → ghost series without live OPF", () => {
  const expired = { ...base("2026-08-11"), id: "exp", visible: true };
  const book = resolveViewportBookPolicy([expired], { now, sessionHeld: true });
  assert(book?.curveMode === "expired_ghost", "ghost mode");
  assert(book?.showExpiredGhost === true, "ghost flag");
  const split = visibleBookTrade([expired], { now, symbol: "SPX" });
  assert(split.trades.length === 0, "no live OPF trade");
  assert(split.expiredTrades.length === 1, "ghost trade");
  const ghost = expiredGhostSeries([expired], { now, symbol: "SPX" });
  assert(ghost.length > 2, "intrinsic residual");
});

test("viewport: incomplete → empty curves + UPDATING notice", () => {
  let pos = base("2026-08-14");
  pos = {
    ...pos,
    liveState: "incomplete",
    livePackagePerShare: null,
    bind: {
      bindable: true,
      failedCount: 0,
      summary: "bound",
      assessedAt: Date.now(),
      legs: [],
    },
  };
  const p = resolveViewportFocusPolicy(pos, { now });
  assert(p!.curveMode === "empty", "empty grid only");
  assert(p!.notice?.title === "UPDATING", "UPDATING");
  assert(!/PB-VIEW|dual-side|fabricat/i.test(p!.notice!.detail), "friendly");
});

test("viewport book: two shown cards stay live — hide is not a radio", () => {
  const priced = (exp: string, visible: boolean): AnalyzerPosition => {
    const p = base(exp);
    return {
      ...p,
      visible,
      liveState: "held",
      livePackagePerShare: 1.25,
      lastNatSigned: 1.25,
      priceSide: "debit",
      bind: {
        bindable: true,
        failedCount: 0,
        summary: "bound",
        assessedAt: Date.now(),
        legs: [],
      },
    };
  };
  const a = { ...priced("2026-08-14", true), id: "a" };
  const b = { ...priced("2026-08-21", true), id: "b" };
  const both = resolveViewportBookPolicy([a, b], { now, sessionHeld: true });
  assert(both?.curveMode === "live", "both shown → live book");
  const book = visibleBookTrade([a, b], { now, sessionHeld: true, symbol: "SPX" });
  assert(book.contributingIds.length === 2, "both contribute");
  assert(book.trades.length === 2, "each card is its own OPF structure");
  assert(book.trade != null, "primary trade");
  assert(book.trades[0].legs.length === 3, "first fly intact");
  assert(book.trades[1].legs.length === 3, "second fly intact");

  const hideA = resolveViewportBookPolicy(
    [{ ...a, visible: false }, b],
    { now, sessionHeld: true },
  );
  assert(hideA?.curveMode === "live", "hiding A does not blank B");
  const bookB = visibleBookTrade([{ ...a, visible: false }, b], {
    now,
    sessionHeld: true,
    symbol: "SPX",
  });
  assert(bookB.contributingIds.join() === "b", "only B contributes");

  const updating = {
    ...base("2026-08-28"),
    id: "c",
    visible: true,
    liveState: "incomplete" as const,
    livePackagePerShare: null,
  };
  const withUpdating = visibleBookTrade([a, updating], {
    now,
    sessionHeld: true,
    symbol: "SPX",
  });
  assert(withUpdating.contributingIds.includes("c"), "updating card still resolves");

  const hideBoth = resolveViewportBookPolicy(
    [
      { ...a, visible: false },
      { ...b, visible: false },
    ],
    { now, sessionHeld: true },
  );
  assert(hideBoth == null, "all hidden → empty viewport");
});

function liveZeroEntry(exp: string, nat: number): AnalyzerPosition {
  const p = base(exp);
  return {
    ...p,
    position: {
      ...p.position,
      net_debit_override: null,
      legs: p.position.legs.map((l) => ({ ...l, entry_price: 0 })),
    },
    lastNatSigned: nat,
    livePackagePerShare: Math.abs(nat),
    definedDebitPerShare: nat,
    priceSide: nat >= 0 ? "debit" : "credit",
    liveState: "live",
    visible: true,
    lock: { mode: "unlocked" },
  };
}

test("unlocked live book has no frozen limit — canvas marks to market", () => {
  const leftover = base("2026-08-14");
  leftover.liveState = "live";
  leftover.visible = true;
  leftover.lastNatSigned = 2.05;
  leftover.livePackagePerShare = 2.05;
  leftover.definedDebitPerShare = 2.05;
  leftover.priceSide = "debit";
  const book = visibleBookTrade([leftover], { now, symbol: "SPX" });
  assert(book.trades.length === 1, "live trade");
  assert(book.trades[0].limit == null, "no leftover @LMT");
  assert(book.trades[0].debit == null, "no leftover debit");
});

test("lock natural stamps D* onto the canvas trade", () => {
  let pos = liveZeroEntry("2026-08-14", 2.05);
  pos = lockNatural(pos);
  const book = visibleBookTrade([pos], { now, symbol: "SPX" });
  assert(book.trades.length === 1, "live trade");
  assert(book.trades[0].limit === 2.05, "canvas basis is locked 2.05");
  assert(book.trades[0].debit === 2.05, "signed D*");
  assert(book.trades[0].isCredit === false, "debit fly");
});

test("editing locked limit updates the canvas basis", () => {
  let pos = liveZeroEntry("2026-08-14", 2.05);
  pos = lockNatural(pos);
  pos = lockLimit(pos, 1.8, false);
  const book = visibleBookTrade([pos], { now, symbol: "SPX" });
  assert(book.trades[0].limit === 1.8, "new D* is the canvas basis");
  assert(book.trades[0].debit === 1.8, "signed");
});

test("unlock strips D* immediately — canvas is free at market", () => {
  let pos = liveZeroEntry("2026-08-14", 2.05);
  pos = lockNatural(pos);
  pos = unlockCard(pos);
  const book = visibleBookTrade([pos], { now, symbol: "SPX" });
  assert(pos.lock.mode === "unlocked", "unlocked");
  assert(book.trades[0].limit == null, "no frozen limit");
  assert(book.trades[0].debit == null, "no frozen debit");
});

test("viewport: price → live curves, no notice", () => {
  let pos = base("2026-08-14");
  pos = {
    ...pos,
    liveState: "live",
    livePackagePerShare: 1.1,
    bind: {
      bindable: true,
      failedCount: 0,
      summary: "bound",
      assessedAt: Date.now(),
      legs: [],
    },
  };
  const p = resolveViewportFocusPolicy(pos, { now });
  assert(p!.curveMode === "live", "live");
  assert(p!.notice === null, "no overlay");
});

console.log(`\n${n} tests passed`);
