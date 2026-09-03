/**
 * AZ-ALGO trail math — pure. No UI.
 * v1 stepper (W1) stands. v2: risk_taken / Batman / legacy S=(1−g)×H / override (P2).
 */

import type { LegInput } from "./positionTypes";
import { normalizeStrike } from "./listedStrikes";
import { sessionEodMs } from "./whatIfClocks";

export type AlgoSide = "near" | "far";
export type AlgoPhase = "waiting" | "armed" | "recorded";
export type InvertNamed = "ok" | "missing";

export type AlgoFlyCard = {
  legs: readonly Pick<LegInput, "strike" | "quantity" | "side" | "type">[];
  /** Entry debit dollars, positive. */
  debit: number;
};

export type PnLSample = { price: number; pnl: number };

export type AlgoTrailInput = {
  spot: number;
  U: number;
  debit: number;
  entryPct: number;
  f0: number;
  fMin: number;
  /** Remaining package extrinsic E(t). Null = unmeasured (clock-only / hold last f). */
  E: number | null;
  EArm: number | null;
  remainingLastTrade: number;
  remainingLastTradeAtArm: number;
  body: number;
  curve: readonly PnLSample[];
  prev?: AlgoTrailState | null;
};

export type AlgoTrailState = {
  phase: AlgoPhase;
  side: AlgoSide;
  f: number;
  H: number;
  /** Current unrealized gain — same units as H. */
  U: number;
  S: number;
  xH: number | null;
  xS: number | null;
  invertNamed: InvertNamed;
  pulse: boolean;
  exitSide?: AlgoSide;
};

export const ALGO_ENTRY_PCT_DEFAULT = 0.75;
/** Give-up fraction of high-water profit at arm (75% trail → keep 25%). */
export const ALGO_F0_DEFAULT = 0.75;
/** Give-up fraction at decay end (25% trail → keep 75%). */
export const ALGO_FMIN_DEFAULT = 0.25;

/**
 * Reason box on a trail stop. Off or blank → built-in trail engine.
 * On with text → inject that prompt for AI hold/fold at that stop.
 */
export function algoReasonPrompt(on: boolean, text: string): string | undefined {
  if (!on) return undefined;
  const t = (text || "").trim();
  return t.length ? t : undefined;
}
export const ALGO_PULSE_ON = 0.2;
export const ALGO_PULSE_OFF = 0.25;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export type InferredFly = {
  body: number;
  wings: [number, number];
  right: "call" | "put";
  longFly: boolean;
};

export function inferLongFly(
  legs: readonly Pick<LegInput, "strike" | "quantity" | "side" | "type">[],
): InferredFly | null {
  if (!legs.length) return null;
  const rights = new Set(legs.map((l) => l.type));
  if (rights.size !== 1) return null;
  const right = legs[0].type;
  const byK = new Map<number, { long: number; short: number }>();
  for (const l of legs) {
    const k = normalizeStrike(l.strike);
    if (!(k > 0)) return null;
    const q = Math.abs(Number(l.quantity) || 0);
    if (!(q > 0)) continue;
    const row = byK.get(k) ?? { long: 0, short: 0 };
    if (l.side === "short") row.short += q;
    else row.long += q;
    byK.set(k, row);
  }
  const strikes = [...byK.keys()].sort((a, b) => a - b);
  if (strikes.length !== 3) return null;
  const net = (k: number) => {
    const r = byK.get(k)!;
    return r.long - r.short;
  };
  const n0 = net(strikes[0]);
  const n1 = net(strikes[1]);
  const n2 = net(strikes[2]);
  const longFly = n0 === 1 && n1 === -2 && n2 === 1;
  const shortFly = n0 === -1 && n1 === 2 && n2 === -1;
  if (!longFly && !shortFly) return null;
  return {
    body: strikes[1],
    wings: [strikes[0], strikes[2]],
    right,
    longFly,
  };
}

/**
 * Entry debit for Algo eligibility (OPF sign: debit > 0).
 * Card package / locked D* first — leg entry_price is often blank after hydrate.
 */
export function algoEntryDebit(opts: {
  definedDebitPerShare?: number | null;
  lockMode?: string;
  lockPackageDebit?: number | null;
  livePackagePerShare?: number | null;
  priceSide?: "debit" | "credit" | null;
  /** positionNetPremium: credit > 0, debit < 0 */
  netPremium?: number | null;
}): number {
  const defined = opts.definedDebitPerShare;
  if (defined != null && Number.isFinite(defined) && defined > 0) return defined;
  if (
    opts.lockMode === "locked" &&
    opts.lockPackageDebit != null &&
    Number.isFinite(opts.lockPackageDebit) &&
    opts.lockPackageDebit > 0
  ) {
    return opts.lockPackageDebit;
  }
  if (
    opts.priceSide === "debit" &&
    opts.livePackagePerShare != null &&
    opts.livePackagePerShare > 0
  ) {
    return opts.livePackagePerShare;
  }
  const net = opts.netPremium;
  if (net != null && Number.isFinite(net) && net < 0) return -net;
  return 0;
}

/** Spec §3 — long OTM debit butterfly. ATM body (nearest listed to spot) is out. */
export function isOtmDebitButterfly(
  card: AlgoFlyCard,
  spot: number,
  listed?: readonly number[],
): boolean {
  if (!(spot > 0)) return false;
  if (!(card.debit > 0)) return false;
  const fly = inferLongFly(card.legs);
  if (!fly || !fly.longFly) return false;
  const listedSorted = (listed ?? []).filter((k) => k > 0).sort((a, b) => a - b);
  if (listedSorted.length) {
    let atm = listedSorted[0];
    let best = Math.abs(atm - spot);
    for (const k of listedSorted) {
      const d = Math.abs(k - spot);
      if (d < best) {
        best = d;
        atm = k;
      }
    }
    if (normalizeStrike(atm) === normalizeStrike(fly.body)) return false;
  }
  if (fly.right === "call") return fly.body > spot;
  return fly.body < spot;
}

/** `"eod"` = this session’s last trade. Else an absolute ISO / epoch ms. */
export type AlgoDecayEnd = "eod" | string | number;

export function resolveDecayEndMs(
  decayEnd: AlgoDecayEnd | null | undefined,
  symbol: string,
  nowMs: number = Date.now(),
): number {
  if (decayEnd != null && decayEnd !== "eod") {
    const t =
      typeof decayEnd === "number" ? decayEnd : Date.parse(String(decayEnd));
    if (Number.isFinite(t) && t > 0) return t;
  }
  return sessionEodMs(symbol, nowMs);
}

export function remainingToDecayEndHours(endMs: number, nowMs: number): number {
  const rem = (endMs - nowMs) / 3_600_000;
  if (!Number.isFinite(rem) || rem <= 0) return 0;
  return rem;
}

export function shouldArm(U: number, debit: number, entryPct = ALGO_ENTRY_PCT_DEFAULT): boolean {
  if (!(debit > 0) || !Number.isFinite(U)) return false;
  return U >= entryPct * debit;
}

/**
 * Clock remaining is time until **decay end** (default EoD).
 * `remainingLastTrade*` names kept so existing callers stay valid.
 */
export function trailFractionRaw(opts: {
  f0: number;
  fMin: number;
  E: number | null;
  EArm: number | null;
  remainingLastTrade: number;
  remainingLastTradeAtArm: number;
}): number {
  const f0 = opts.f0;
  const fMin = opts.fMin;
  let decay = 0;
  if (opts.EArm != null && opts.EArm > 0 && opts.E != null && Number.isFinite(opts.E)) {
    decay = 1 - clamp(opts.E / opts.EArm, 0, 1);
  }
  const remArm = Math.max(opts.remainingLastTradeAtArm, 0);
  const rem = Math.max(opts.remainingLastTrade, 0);
  const clock = remArm > 0 ? 1 - clamp(rem / remArm, 0, 1) : 1;
  const fDecay = f0 + (fMin - f0) * decay;
  const fClock = f0 + (fMin - f0) * clock;
  return clamp(Math.min(fDecay, fClock), fMin, f0);
}

/**
 * Trail % is **give-up of profit**, not keep-fraction and not total value.
 * 75% trail → S = 25% of high-water profit.
 */
export function trailProfitStop(giveUp: number, highWater: number): number {
  const H = Math.max(highWater, 0);
  if (!(H > 0) || !Number.isFinite(giveUp)) return 0;
  const g = clamp(giveUp, 0, 1);
  return (1 - g) * H;
}

export function applyFMonotone(prevF: number | null, fRaw: number, f0: number, fMin: number): number {
  const raw = clamp(fRaw, fMin, f0);
  if (prevF == null || !Number.isFinite(prevF)) return raw;
  return Math.min(prevF, raw);
}

/** Linear crossings of pnl = level, sorted by price. */
export function invertPnlCrossings(
  curve: readonly PnLSample[],
  level: number,
): number[] {
  const pts = curve
    .filter((p) => Number.isFinite(p.price) && Number.isFinite(p.pnl))
    .slice()
    .sort((a, b) => a.price - b.price);
  const out: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const da = a.pnl - level;
    const db = b.pnl - level;
    if (da === 0) {
      out.push(a.price);
      continue;
    }
    if (da * db < 0) {
      const t = da / (da - db);
      out.push(a.price + t * (b.price - a.price));
    }
  }
  const last = pts[pts.length - 1];
  if (last && last.pnl === level) out.push(last.price);
  return out;
}

export function pickTrailUnderlier(opts: {
  crossings: readonly number[];
  side: AlgoSide;
  spot: number;
  xH: number;
  body: number;
}): number | null {
  const xs = opts.crossings.filter((x) => Number.isFinite(x));
  if (!xs.length) return null;
  const { side, spot, xH, body } = opts;
  const lo = Math.min(spot, xH);
  const hi = Math.max(spot, xH);
  const between = xs.filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9);
  if (side === "near") {
    if (between.length) {
      return between.reduce((best, x) =>
        Math.abs(x - spot) < Math.abs(best - spot) ? x : best,
      );
    }
    const nearSide = xs.filter((x) =>
      body > spot || body > xH ? x <= body : x >= body,
    );
    const pool = nearSide.length ? nearSide : xs;
    return pool.reduce((best, x) =>
      Math.abs(x - spot) < Math.abs(best - spot) ? x : best,
    );
  }
  const far = xs.filter((x) => (spot >= body || xH >= body ? x >= body : x <= body));
  const pool = far.length ? far : xs;
  return pool.reduce((best, x) =>
    Math.abs(x - body) > Math.abs(best - body) ? x : best,
  );
}

function crossedValue(a: number, b: number, x: number): boolean {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (!(hi > lo)) return false;
  return x > lo && x <= hi;
}

function movingAwayFromBody(prev: number, now: number, body: number): boolean {
  return Math.abs(now - body) > Math.abs(prev - body);
}

export function bodyCrossed(prevSpot: number, spot: number, body: number): boolean {
  if (!Number.isFinite(prevSpot) || !Number.isFinite(spot) || !Number.isFinite(body)) {
    return false;
  }
  const a = prevSpot - body;
  const b = spot - body;
  return a === 0 ? b !== 0 : a * b < 0;
}

export function threatenPulse(opts: {
  spot: number;
  xH: number;
  xS: number;
  prevPulse: boolean;
}): { G: number; pulse: boolean; frac: number } {
  const G = Math.abs(opts.xH - opts.xS);
  if (!(G > 1e-9)) return { G: 0, pulse: false, frac: 0 };
  const d = Math.abs(opts.spot - opts.xS);
  const frac = clamp(d / G, 0, 1);
  const inOn = frac <= ALGO_PULSE_ON;
  const inOff = frac <= ALGO_PULSE_OFF;
  const pulse = opts.prevPulse ? inOff : inOn;
  return { G, pulse, frac };
}

export function stepAlgoTrail(
  input: AlgoTrailInput & { prevSpot?: number },
): AlgoTrailState {
  return stepAlgoTrailWithPrevSpot({
    ...input,
    prevSpot: input.prevSpot ?? input.spot,
  });
}

/** Explicit prev spot for body-cross / exit. */
export function stepAlgoTrailWithPrevSpot(
  input: AlgoTrailInput & { prevSpot: number },
): AlgoTrailState {
  const prev = input.prev ?? null;
  const f0 = input.f0;
  const fMin = input.fMin;

  if (prev?.phase === "recorded") return { ...prev, pulse: false };

  const armedAlready = prev?.phase === "armed";
  if (!armedAlready && !shouldArm(input.U, input.debit, input.entryPct)) {
    return {
      phase: "waiting",
      side: "near",
      f: f0,
      H: 0,
      U: input.U,
      S: 0,
      xH: null,
      xS: null,
      invertNamed: "missing",
      pulse: false,
    };
  }

  const fRaw = trailFractionRaw({
    f0,
    fMin,
    E: input.E,
    EArm: input.EArm,
    remainingLastTrade: input.remainingLastTrade,
    remainingLastTradeAtArm: input.remainingLastTradeAtArm,
  });
  const f = applyFMonotone(armedAlready ? prev!.f : f0, fRaw, f0, fMin);
  const H = armedAlready ? Math.max(prev!.H, input.U) : input.U;
  const S = trailProfitStop(f, H);
  let xH = armedAlready ? prev!.xH : input.spot;
  if (!armedAlready || input.U > (prev?.H ?? -Infinity) + 1e-12) xH = input.spot;
  if (xH == null) xH = input.spot;

  let side: AlgoSide = armedAlready ? prev!.side : "near";
  if (armedAlready) {
    const ps = input.prevSpot;
    if (ps < input.body && input.spot >= input.body) side = "far";
    else if (ps > input.body && input.spot <= input.body) side = "far";
    if (prev!.side === "far") {
      if (ps >= input.body && input.spot < input.body) side = "near";
      else if (ps <= input.body && input.spot > input.body) side = "near";
    }
  }

  const crossings = invertPnlCrossings(input.curve, S);
  const xS = pickTrailUnderlier({
    crossings,
    side,
    spot: input.spot,
    xH,
    body: input.body,
  });
  const invertNamed: InvertNamed = xS != null ? "ok" : "missing";

  let phase: AlgoPhase = "armed";
  let exitSide: AlgoSide | undefined;
  if (invertNamed === "missing") {
    if (input.U < S) {
      phase = "recorded";
      exitSide = side;
    }
  } else if (xS != null && armedAlready) {
    if (
      crossedValue(input.prevSpot, input.spot, xS) &&
      movingAwayFromBody(input.prevSpot, input.spot, input.body)
    ) {
      phase = "recorded";
      exitSide = side;
    }
  }

  const pulse =
    phase === "armed" && xS != null
      ? threatenPulse({
          spot: input.spot,
          xH,
          xS,
          prevPulse: armedAlready ? prev!.pulse : false,
        }).pulse
      : false;

  return {
    phase,
    side,
    f,
    H,
    U: input.U,
    S,
    xH,
    xS: invertNamed === "ok" ? xS : armedAlready ? prev?.xS ?? null : null,
    invertNamed,
    pulse: phase === "recorded" ? false : pulse,
    exitSide,
  };
}

/** v2 name for the give-up running minimum (ALGO-A1). g never increases. */
export const applyGMonotone = applyFMonotone;

export type BatmanFly = {
  kind: "call" | "put";
  body: number;
  debit: number;
  U: number;
};

export type WorkingSide = "call" | "put" | "ambiguous";

/**
 * Closer body wins. Ties, or spot strictly between bodies → larger U.
 * Equal U → ambiguous. Never `>=` on a tie (that quietly picks a side).
 */
export function resolveWorkingSide(
  spot: number,
  call: BatmanFly,
  put: BatmanFly,
): WorkingSide {
  const dCall = Math.abs(spot - call.body);
  const dPut = Math.abs(spot - put.body);
  const lo = Math.min(call.body, put.body);
  const hi = Math.max(call.body, put.body);
  const between = spot > lo && spot < hi;
  if (!between && dCall !== dPut) {
    return dCall < dPut ? "call" : "put";
  }
  if (call.U > put.U) return "call";
  if (put.U > call.U) return "put";
  return "ambiguous";
}

export function riskTakenForSide(
  working: WorkingSide,
  call: BatmanFly,
  put: BatmanFly,
): number | null {
  if (working === "ambiguous") return null;
  return working === "call" ? call.debit : put.debit;
}

export type GateResult = {
  workingSide: WorkingSide;
  riskTaken: number | null;
  U: number | null;
  gate: number | null;
  managing: boolean;
  paint: boolean;
  named: string | null;
};

/** Gate = entryPct × risk_taken of the working fly only. Pair debit is not the denominator. */
export function evaluateBatmanGate(
  spot: number,
  call: BatmanFly,
  put: BatmanFly,
  entryPct: number,
): GateResult {
  const workingSide = resolveWorkingSide(spot, call, put);
  if (workingSide === "ambiguous") {
    return {
      workingSide,
      riskTaken: null,
      U: null,
      gate: null,
      managing: false,
      paint: false,
      named: "working_side: ambiguous",
    };
  }
  const riskTaken = riskTakenForSide(workingSide, call, put)!;
  const U = workingSide === "call" ? call.U : put.U;
  const gate = entryPct * riskTaken;
  const managing = U >= gate;
  return {
    workingSide,
    riskTaken,
    U,
    gate,
    managing,
    paint: managing,
    named: null,
  };
}

export type LegacyTrail = {
  g: number;
  S: number;
  chrome: string;
  clockOnly: boolean;
};

/** Legacy S(t)=(1−g)×H. Floor is not applied here. E null → clock-only chrome. */
export function legacyTrail(opts: {
  H: number;
  g0: number;
  gMin: number;
  E: number | null;
  EArm: number | null;
  remainingNow: number;
  remainingAtArm: number;
  prevG: number | null;
}): LegacyTrail {
  const gRaw = trailFractionRaw({
    f0: opts.g0,
    fMin: opts.gMin,
    E: opts.E,
    EArm: opts.EArm,
    remainingLastTrade: opts.remainingNow,
    remainingLastTradeAtArm: opts.remainingAtArm,
  });
  const g = applyGMonotone(opts.prevG, gRaw, opts.g0, opts.gMin);
  const S = trailProfitStop(g, opts.H);
  const clockOnly = opts.E == null || opts.EArm == null;
  return {
    g,
    S,
    chrome: clockOnly
      ? "floor: legacy (clock-only)"
      : "floor: legacy (decay)",
    clockOnly,
  };
}

export function highWaterOnSideSwitch(opts: {
  prevWorking: WorkingSide;
  nextWorking: WorkingSide;
  prevH: number;
  nextU: number;
}): { H: number; h_prior_side: number | null; switched: boolean } {
  const prev = opts.prevWorking;
  const next = opts.nextWorking;
  const switched =
    prev !== "ambiguous" &&
    next !== "ambiguous" &&
    prev !== next;
  if (!switched) {
    return { H: Math.max(opts.prevH, opts.nextU), h_prior_side: null, switched: false };
  }
  return { H: opts.nextU, h_prior_side: opts.prevH, switched: true };
}

export type FoldOverrideState = {
  overridden: boolean;
  reentryCount: number;
};

/** Beyond the guide: U still below trail_level. Override suppresses re-fire until re-entry holds. */
export function foldOverrideTick(opts: {
  U: number;
  trailLevel: number;
  prev: FoldOverrideState;
  reentryBars: number;
}): { fire: boolean; hud: string | null; next: FoldOverrideState } {
  const beyond = opts.U < opts.trailLevel;
  if (!opts.prev.overridden) {
    return {
      fire: beyond,
      hud: null,
      next: { overridden: false, reentryCount: 0 },
    };
  }
  if (beyond) {
    return {
      fire: false,
      hud: "guide: overridden",
      next: { overridden: true, reentryCount: 0 },
    };
  }
  const reentryCount = opts.prev.reentryCount + 1;
  if (reentryCount >= opts.reentryBars) {
    return {
      fire: false,
      hud: null,
      next: { overridden: false, reentryCount: 0 },
    };
  }
  return {
    fire: false,
    hud: "guide: overridden",
    next: { overridden: true, reentryCount },
  };
}
