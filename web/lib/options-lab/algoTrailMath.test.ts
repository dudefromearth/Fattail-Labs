/**
 * AZ-ALGO W1 fixtures (plan §8) + shared conformance set (v1.0.2).
 * Knobs (`entry_pct`, `trail_start_pct`, `trail_floor_pct`) are inputs.
 *   npx --yes tsx lib/options-lab/algoTrailMath.test.ts
 */

import {
  ALGO_ENTRY_PCT_DEFAULT,
  ALGO_F0_DEFAULT,
  ALGO_FMIN_DEFAULT,
  remainingToDecayEndHours,
  resolveDecayEndMs,
  algoEntryDebit,
  algoReasonPrompt,
  applyFMonotone,
  trailProfitStop,
  inferLongFly,
  invertPnlCrossings,
  isOtmDebitButterfly,
  pickTrailUnderlier,
  shouldArm,
  stepAlgoTrailWithPrevSpot,
  threatenPulse,
  trailFractionRaw,
  type AlgoFlyCard,
  type AlgoTrailState,
  type PnLSample,
} from "./algoTrailMath";
import {
  ALGO_CONFORMANCE_KNOBS,
  algoRecordedHolderSubtitle,
  algoRecordedPayload,
  trailMathFromKnobs,
  type AlgoKnobInputs,
} from "./algoTrailConformance";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

const BODY = 6100;
const DEBIT = 4;

function tentPnl(price: number): number {
  const dist = Math.abs(price - BODY);
  if (dist >= 40) return -2;
  if (dist <= 20) return 4 - (4 * dist) / 20;
  return 0 - 2 * ((dist - 20) / 20);
}

function tentCurve(): PnLSample[] {
  const pts: PnLSample[] = [];
  for (let p = 6040; p <= 6160; p += 1) {
    pts.push({ price: p, pnl: tentPnl(p) });
  }
  return pts;
}

function longCallFly(): AlgoFlyCard {
  return {
    debit: DEBIT,
    legs: [
      { strike: 6080, quantity: 1, side: "long", type: "call" },
      { strike: 6100, quantity: 2, side: "short", type: "call" },
      { strike: 6120, quantity: 1, side: "long", type: "call" },
    ],
  };
}

const LISTED = [6060, 6080, 6100, 6120, 6140];

/** This run’s placeholder knobs (DL-482). Swap knobs — do not recut expects. */
const knobs: AlgoKnobInputs = { ...ALGO_CONFORMANCE_KNOBS };

function baseFrom(k: AlgoKnobInputs) {
  return {
    debit: DEBIT,
    ...trailMathFromKnobs(k),
    E: 2,
    EArm: 2,
    remainingLastTrade: 5,
    remainingLastTradeAtArm: 5,
    body: BODY,
    curve: tentCurve(),
  };
}

const base = baseFrom(knobs);

console.log("algoTrailMath W1");

test("Reason off or blank uses the built-in engine; on stores the prompt", () => {
  assert(algoReasonPrompt(false, "weigh GEX") === undefined, "off");
  assert(algoReasonPrompt(true, "  ") === undefined, "blank");
  assert(
    algoReasonPrompt(true, "  hold if GEX still supports  ") ===
      "hold if GEX still supports",
    "prompt",
  );
});

test("member knobs default 75 / 75 / 25 (placeholders, not fixture law)", () => {
  assert(ALGO_ENTRY_PCT_DEFAULT === 0.75, "start at 75% of debit");
  assert(ALGO_F0_DEFAULT === 0.75, "75% trail = give up 75% of profit");
  assert(ALGO_FMIN_DEFAULT === 0.25, "25% trail = give up 25% of profit");
  assert(Math.abs(trailProfitStop(0.75, 8) - 2) < 1e-9, "75% of $8 profit → keep $2");
  assert(Math.abs(trailProfitStop(0.25, 8) - 6) < 1e-9, "25% of $8 profit → keep $6");
  {
    const debit = 100;
    const mark = 175;
    const profit = mark - debit;
    assert(profit === 75, "175 mark on 100 debit is $75 profit");
    assert(shouldArm(profit, debit, 0.75), "75 profit arms at 75% of debit");
    const give = profit * 0.75;
    assert(Math.abs(give - 56.25) < 1e-9, "give up 75% of $75 = $56.25");
    const keep = trailProfitStop(0.75, profit);
    assert(Math.abs(keep - 18.75) < 1e-9, "keep $18.75 of profit");
    const stopMark = debit + keep;
    assert(Math.abs(stopMark - 118.75) < 1e-9, "stop at 175 - 56.25 = 118.75");
  }
  assert(knobs.entry_pct === ALGO_ENTRY_PCT_DEFAULT, "conformance uses same placeholders");
  assert(knobs.trail_floor_pct === ALGO_FMIN_DEFAULT, "floor input is the default placeholder");
});

test("unspecified decay end is session EoD; clock hits fMin at that instant", () => {
  const noon = Date.parse("2026-08-20T12:00:00-04:00");
  const eod = resolveDecayEndMs("eod", "SPX", noon);
  const eodSame = resolveDecayEndMs(null, "SPX", noon);
  assert(eod === eodSame, "blank = EoD");
  const remEod = remainingToDecayEndHours(eod, noon);
  assert(Math.abs(remEod - 4.25) < 0.02, `SPX EoD 16:15 from noon, got ${remEod}`);
  const custom = Date.parse("2026-08-20T14:00:00-04:00");
  const remCustom = remainingToDecayEndHours(custom, noon);
  assert(Math.abs(remCustom - 2) < 0.02, "specified 14:00");
  const atEnd = trailFractionRaw({
    f0: knobs.trail_start_pct,
    fMin: knobs.trail_floor_pct,
    E: null,
    EArm: null,
    remainingLastTrade: 0,
    remainingLastTradeAtArm: 4.25,
  });
  assert(atEnd === knobs.trail_floor_pct, "clock done → trail end % from knobs");
});

test("0 locked D* debit (positive OPF) is the entry debit — not only negative lock", () => {
  assert(
    algoEntryDebit({
      netPremium: 0,
      lockMode: "locked",
      lockPackageDebit: 1.25,
      livePackagePerShare: 1.25,
      priceSide: "debit",
    }) === 1.25,
    "locked +1.25 debit",
  );
  assert(
    algoEntryDebit({
      netPremium: 0,
      lockMode: "locked",
      lockPackageDebit: -1.25,
    }) === 0,
    "locked credit is not an Algo debit",
  );
  const card = longCallFly();
  card.debit = algoEntryDebit({
    lockMode: "locked",
    lockPackageDebit: 1.25,
    netPremium: 0,
  });
  assert(isOtmDebitButterfly(card, 6050, LISTED), "OTM fly with locked debit");
});

test("1 symmetric long call fly, body > spot → eligible; ATM body not", () => {
  const card = longCallFly();
  assert(isOtmDebitButterfly(card, 6050, LISTED), "OTM call fly eligible");
  assert(!isOtmDebitButterfly(card, 6100, LISTED), "ATM body not eligible");
  assert(!isOtmDebitButterfly(card, 6099.4, LISTED), "nearest listed 6100 = body");
});

test("2 credit / short fly → not eligible", () => {
  const short: AlgoFlyCard = {
    debit: 1.5,
    legs: [
      { strike: 6080, quantity: 1, side: "short", type: "call" },
      { strike: 6100, quantity: 2, side: "long", type: "call" },
      { strike: 6120, quantity: 1, side: "short", type: "call" },
    ],
  };
  assert(inferLongFly(short.legs)?.longFly === false, "short fly");
  assert(!isOtmDebitButterfly(short, 6050, LISTED), "credit structure out");
  const creditLong: AlgoFlyCard = { ...longCallFly(), debit: 0 };
  assert(!isOtmDebitButterfly(creditLong, 6050, LISTED), "debit must be > 0");
});

test("3 arm at U ≥ entry_pct · D", () => {
  const threshold = DEBIT * knobs.entry_pct;
  assert(!shouldArm(threshold - 0.01, DEBIT, knobs.entry_pct), "below");
  assert(shouldArm(threshold, DEBIT, knobs.entry_pct), "equal");
  assert(shouldArm(threshold + 0.2, DEBIT, knobs.entry_pct), "above");
});

test("4 H ratchet; S = (1 − f) × H (give-up % of profit)", () => {
  let st: AlgoTrailState | null = null;
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6088,
    prevSpot: 6088,
    U: 3.1,
    prev: st,
  });
  assert(st.phase === "armed", "armed");
  assert(Math.abs(st.H - 3.1) < 1e-9, "H=U");
  const f0 = st.f;
  assert(Math.abs(st.S - trailProfitStop(f0, 3.1)) < 1e-9, "S=(1-f)H");
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6092,
    prevSpot: 6088,
    U: 3.6,
    prev: st,
  });
  assert(st.H >= 3.6 - 1e-9, "H ratchets up");
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6090,
    prevSpot: 6092,
    U: 3.2,
    prev: st,
  });
  assert(st.H >= 3.6 - 1e-9, "H never decreases");
});

test("5 E(t) up (IV pop) does not raise f (A1)", () => {
  const a = trailFractionRaw({
    f0: knobs.trail_start_pct,
    fMin: knobs.trail_floor_pct,
    E: 1,
    EArm: 2,
    remainingLastTrade: 4,
    remainingLastTradeAtArm: 5,
  });
  const b = trailFractionRaw({
    f0: knobs.trail_start_pct,
    fMin: knobs.trail_floor_pct,
    E: 1.8,
    EArm: 2,
    remainingLastTrade: 4,
    remainingLastTradeAtArm: 5,
  });
  assert(b > a, "raw f would loosen if E rises");
  const mono = applyFMonotone(
    a,
    b,
    knobs.trail_start_pct,
    knobs.trail_floor_pct,
  );
  assert(mono === a, "running min holds f");
  let st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6088,
    prevSpot: 6088,
    U: 3.1,
    E: 1,
    EArm: 2,
    remainingLastTrade: 4,
    remainingLastTradeAtArm: 5,
  });
  const fTight = st.f;
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6089,
    prevSpot: 6088,
    U: 3.1,
    E: 1.8,
    EArm: 2,
    remainingLastTrade: 4,
    remainingLastTradeAtArm: 5,
    prev: st,
  });
  assert(st.f <= fTight + 1e-12, "IV pop must not loosen f");
});

test("6 near invert between spot and xH", () => {
  const xs = invertPnlCrossings(tentCurve(), 3);
  assert(xs.length >= 2, "two tent crossings");
  const xS = pickTrailUnderlier({
    crossings: xs,
    side: "near",
    spot: 6088,
    xH: 6096,
    body: BODY,
  });
  assert(xS != null, "has near");
  assert(xS! >= 6088 - 1e-6 && xS! <= 6096 + 1e-6, "between spot and xH");
});

test("7 B1 far-side blow-through records exit_side far", () => {
  let st: AlgoTrailState | null = null;
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6086,
    prevSpot: 6086,
    U: 3.05,
    prev: st,
  });
  assert(st.phase === "armed", "armed near");
  assert(st.side === "near", "near");
  const nearXs = st.xS;
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6094,
    prevSpot: 6086,
    U: 3.7,
    prev: st,
  });
  assert(st.H >= 3.7 - 1e-9, "ratchet");
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6102,
    prevSpot: 6094,
    U: 3.9,
    prev: st,
  });
  assert(st.side === "far", `through body → far (got ${st.side})`);
  assert(st.phase === "armed", "not yet recorded at body");
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6118,
    prevSpot: 6102,
    U: 1.5,
    prev: st,
  });
  assert(st.phase === "recorded", `must record far blow-through (got ${st.phase})`);
  assert(st.exitSide === "far", `exit_side far (got ${st.exitSide})`);
  assert(
    nearXs == null || 6118 > (nearXs ?? 0),
    "near xS was not the exit print",
  );
});

test("8 recross body → side near", () => {
  let st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6088,
    prevSpot: 6088,
    U: 3.2,
  });
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6104,
    prevSpot: 6088,
    U: 3.8,
    prev: st,
  });
  assert(st.side === "far", "far after through");
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6096,
    prevSpot: 6104,
    U: 3.5,
    prev: st,
  });
  assert(st.side === "near", `recross → near (got ${st.side})`);
});

test("9 invert missing → named; P&L backstop only then", () => {
  let st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6088,
    prevSpot: 6088,
    U: 3.2,
    curve: [],
  });
  assert(st.phase === "armed", "arm without invert");
  assert(st.invertNamed === "missing", "named missing");
  st = stepAlgoTrailWithPrevSpot({
    ...base,
    spot: 6088,
    prevSpot: 6088,
    U: 0.4,
    curve: [],
    prev: st,
  });
  assert(st.phase === "recorded", "U < S backstop");
  assert(st.exitSide === "near" || st.exitSide === "far", "has exit side");
});

test("10 threaten enter 0.20 G, leave 0.25 G", () => {
  const xH = 100;
  const xS = 0;
  const on = threatenPulse({ spot: 15, xH, xS, prevPulse: false });
  assert(on.pulse === true, "enter at 15% of G");
  const hold = threatenPulse({ spot: 22, xH, xS, prevPulse: true });
  assert(hold.pulse === true, "hysteresis holds at 22%");
  const off = threatenPulse({ spot: 30, xH, xS, prevPulse: true });
  assert(off.pulse === false, "exit beyond 25%");
  const stayOff = threatenPulse({ spot: 22, xH, xS, prevPulse: false });
  assert(stayOff.pulse === false, "do not re-enter at 22%");
});

test("knobs are inputs: a different floor does not recut this set", () => {
  const alt: AlgoKnobInputs = { ...knobs, trail_floor_pct: 0.1 };
  const atEnd = trailFractionRaw({
    f0: alt.trail_start_pct,
    fMin: alt.trail_floor_pct,
    E: null,
    EArm: null,
    remainingLastTrade: 0,
    remainingLastTradeAtArm: 4.25,
  });
  assert(atEnd === alt.trail_floor_pct, "clock done uses the input floor");
  const altEntry: AlgoKnobInputs = { ...knobs, entry_pct: 0.5 };
  const th = DEBIT * altEntry.entry_pct;
  assert(shouldArm(th, DEBIT, altEntry.entry_pct), "arm threshold follows entry_pct");
  assert(!shouldArm(th - 0.01, DEBIT, altEntry.entry_pct), "below the input threshold");
});

test("Recorded payload mode labels demo vs live", () => {
  const demo = algoRecordedPayload({
    armed_at: "2026-08-20T13:00:00-04:00",
    recorded_at: "2026-08-20T14:10:00-04:00",
    high_water_pnl: 3.6,
    high_water_spot: 6092,
    trail_pnl: 2.7,
    trail_fraction: knobs.trail_floor_pct,
    trail_spot: 6118,
    exit_spot: 6118,
    exit_side: "far",
    debit: DEBIT,
    entry_pct: knobs.entry_pct,
    mode: "demo_whatif",
  });
  assert(demo.mode === "demo_whatif", "mode field present");
  assert(
    algoRecordedHolderSubtitle(demo.mode) === "Recorded · demo",
    "demo holder",
  );
  const tm = algoRecordedPayload({ ...demo, mode: "demo_timemachine" });
  assert(tm.mode === "demo_timemachine", "timemachine mode");
  assert(
    algoRecordedHolderSubtitle(tm.mode) === "Recorded · demo",
    "both demo modes share Recorded · demo",
  );
  const live = algoRecordedPayload({ ...demo, mode: "live" });
  assert(live.mode === "live", "live distinct");
  assert(
    algoRecordedHolderSubtitle(live.mode, "2:10 PM", "6118") ===
      "Recorded 2:10 PM at 6118",
    "live stamp",
  );
});

console.log(`\n${n} tests passed`);
