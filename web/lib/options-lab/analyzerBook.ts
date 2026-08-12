/**
 * Analyzer position book + threshold alerts (session persistence).
 * PB Spec v0.3 — card = definition; lock signed D*; liveState; B5 invariants.
 *
 * Product status for residual: **ANALYSIS only** (OMS tokens reserved).
 */

import type { PositionInput } from "@/lib/options-lab/positionTypes";
import {
  buildLabel,
  buildNotation,
} from "@/lib/options-lab/positionLabels";
import { positionNetPremium } from "@/lib/options-lab/positionToTrade";
import {
  normalizeStrike,
  snapToListed,
  uniqueListedStrikes,
} from "@/lib/options-lab/listedStrikes";

/** Product status — residual book is ANALYSIS-only (PB v0.3 §16.4). */
export type AnalyzerTradeStatus = "ANALYSIS";

/** Reserved OMS lifecycle tokens — not assignable until a future OD. */
export type ReservedOmsStatus =
  | "PENDING"
  | "OPEN"
  | "PARTIAL_OPEN"
  | "CLOSED"
  | "CANCELLED"
  | "REJECTED";

export type LiveState =
  | "live"
  | "held"
  | "not_live"
  | "budget_refused"
  | "incomplete"
  | "skewed";

export type LockSource = "natural_mid" | "user_limit" | "tos_limit";

/** OPF-aligned lock — package_debit_per_share SIGNED per PB3. */
export type CardLockState =
  | { mode: "unlocked" }
  | {
      mode: "locked";
      lockedAt: string;
      /** Signed per-share D* (same convention as D_nat) */
      packageDebitPerShare: number;
      lockSource: LockSource;
      freezeIv: boolean;
      freezeMarks: boolean;
      generationHashesAtLock?: Record<string, string>;
    };

/** Per-leg bind report (exp first, then price). See optionBind.ts */
export type PositionBindSnapshot = {
  bindable: boolean;
  failedCount: number;
  summary: string;
  assessedAt: number;
  legs: Array<{
    index: number;
    expiration: string;
    strike: number;
    type: "call" | "put";
    expOk: boolean;
    priceOk: boolean;
    reason: string;
    mid: number | null;
  }>;
};

export type AnalyzerPosition = {
  id: string;
  label: string;
  notation: string;
  position: PositionInput;
  status: AnalyzerTradeStatus;
  /** From OPF PackageQuote when unlocked live; basis magnitude when locked */
  livePackagePerShare: number | null;
  /** Signed natural from last OPF quote (for lock natural / parity) */
  lastNatSigned: number | null;
  priceSide: "debit" | "credit" | null;
  visible: boolean;
  lock: CardLockState;
  liveState: LiveState;
  displayAsOf: string | null;
  contentHashes: Record<string, string>;
  maxSkewMs: number | null;
  epochQuality: string | null;
  /**
   * Last bind assessment (exp → price, all legs). Card may only show a live
   * package when bindable && OPF quote complete.
   */
  bind?: PositionBindSnapshot | null;
  createdAt: number;
  updatedAt: number;
};

export type ThresholdAlertType = "price_above" | "price_below" | "price_touch";
export type ThresholdAlertStatus =
  | "new"
  | "acknowledged"
  | "dismissed"
  | "triggered";
export type ThresholdSeverity = "info" | "low" | "medium" | "high" | "critical";

export type AnalyzerThresholdAlert = {
  id: string;
  type: ThresholdAlertType;
  symbol: string;
  targetPrice: number;
  positionId?: string;
  title: string;
  severity: ThresholdSeverity;
  status: ThresholdAlertStatus;
  enabled: boolean;
  createdAt: string;
  triggeredAt?: string;
  color: string;
};

const POS_KEY = "ft_options_lab_analyzer_positions_v2";
const ALERT_KEY = "ft_options_lab_analyzer_alerts_v1";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function migratePos(raw: unknown): AnalyzerPosition | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<AnalyzerPosition> & {
    priceSide?: "debit" | "credit" | null;
  };
  if (!p.id || !p.position) return null;
  return {
    id: p.id,
    label: p.label || "Position",
    notation: p.notation || "",
    position: p.position,
    // Force ANALYSIS — ignore any legacy OMS status from storage (B5)
    status: "ANALYSIS",
    livePackagePerShare: p.livePackagePerShare ?? null,
    lastNatSigned: p.lastNatSigned ?? null,
    // Do not default missing side to debit (painted all cards red)
    priceSide:
      p.priceSide === "debit" || p.priceSide === "credit" ? p.priceSide : null,
    visible: p.visible !== false,
    lock: p.lock?.mode === "locked" ? p.lock : { mode: "unlocked" },
    liveState: p.liveState || "not_live",
    displayAsOf: p.displayAsOf ?? null,
    contentHashes: p.contentHashes || {},
    maxSkewMs: p.maxSkewMs ?? null,
    epochQuality: p.epochQuality ?? null,
    bind: p.bind ?? null,
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now(),
  };
}

export function loadPositions(): AnalyzerPosition[] {
  if (typeof window === "undefined") return [];
  try {
    const s =
      sessionStorage.getItem(POS_KEY) ||
      sessionStorage.getItem("ft_options_lab_analyzer_positions_v1");
    if (!s) return [];
    const arr = JSON.parse(s) as unknown[];
    if (!Array.isArray(arr)) return [];
    return arr.map(migratePos).filter(Boolean) as AnalyzerPosition[];
  } catch {
    return [];
  }
}

export function savePositions(positions: AnalyzerPosition[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(POS_KEY, JSON.stringify(positions));
}

export function positionFromInput(input: PositionInput): AnalyzerPosition {
  // positionNetPremium: MSC sign (credit > 0, debit < 0).
  // Card/OPF lastNatSigned: OPF sign (debit > 0, credit < 0) — must not mix.
  const netMsc = positionNetPremium(input);
  const override = input.net_debit_override;
  let lastNatSigned: number | null = null;
  if (override != null && Number.isFinite(override)) {
    const mag = Math.abs(override);
    // SELL / natural credit → negative OPF; BUY debit → positive OPF
    const isCredit =
      input.direction === "sell" || (Number.isFinite(netMsc) && netMsc > 0);
    lastNatSigned = isCredit ? -mag : mag;
  } else if (Number.isFinite(netMsc) && netMsc !== 0) {
    lastNatSigned = -netMsc; // MSC → OPF
  }
  const priceSide: "debit" | "credit" | null =
    lastNatSigned == null
      ? null
      : lastNatSigned > 0
        ? "debit"
        : lastNatSigned < 0
          ? "credit"
          : null;
  return {
    id: uid("pos"),
    label: buildLabel(input.underlying, input.legs, input.expiration),
    notation: buildNotation(input.legs),
    position: {
      ...input,
      legs: input.legs.map((l) => ({ ...l })),
    },
    status: "ANALYSIS",
    livePackagePerShare:
      lastNatSigned != null ? Math.abs(lastNatSigned) : null,
    lastNatSigned,
    priceSide,
    visible: true,
    lock: { mode: "unlocked" },
    liveState: "not_live",
    displayAsOf: null,
    contentHashes: {},
    maxSkewMs: null,
    epochQuality: null,
    bind: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function sameCardPricing(a: AnalyzerPosition, b: AnalyzerPosition): boolean {
  return (
    a.livePackagePerShare === b.livePackagePerShare &&
    a.lastNatSigned === b.lastNatSigned &&
    a.priceSide === b.priceSide &&
    a.liveState === b.liveState &&
    a.displayAsOf === b.displayAsOf &&
    a.maxSkewMs === b.maxSkewMs &&
    a.epochQuality === b.epochQuality &&
    JSON.stringify(a.contentHashes) === JSON.stringify(b.contentHashes)
  );
}

/**
 * PB v0.3 §16.3 package magnitude law:
 * - unlocked + lastNatSigned set → livePackagePerShare ≡ |lastNatSigned|
 * - locked → livePackagePerShare ≡ |packageDebitPerShare|
 * Incomplete/budget/skewed may clear livePackage (null) — OK.
 */
export function packageMagnitudeInvariantHolds(
  pos: AnalyzerPosition,
): boolean {
  if (pos.lock.mode === "locked") {
    const d = Math.abs(pos.lock.packageDebitPerShare);
    if (pos.livePackagePerShare == null) return false;
    return Math.abs(pos.livePackagePerShare - d) < 1e-9;
  }
  if (pos.lastNatSigned == null) return true;
  if (pos.livePackagePerShare == null) {
    // incomplete / refused / skewed may clear magnitude while keeping prior nat cleared
    return (
      pos.liveState === "incomplete" ||
      pos.liveState === "budget_refused" ||
      pos.liveState === "skewed" ||
      pos.liveState === "not_live"
    );
  }
  return Math.abs(pos.livePackagePerShare - Math.abs(pos.lastNatSigned)) < 1e-9;
}

/** Apply OPF package quote onto card (PB17 SoR). */
export function applyPackageQuote(
  pos: AnalyzerPosition,
  quote: {
    complete?: boolean;
    package_debit_per_share?: number | null;
    max_skew_ms?: number | null;
    epoch_quality?: string | null;
    generations_used?: Record<string, { content_hash?: string; as_of?: string }>;
    as_of?: string | null;
    error?: string | null;
    skew_fail?: boolean;
  },
  opts?: { sessionHeld?: boolean; interestOk?: boolean },
): AnalyzerPosition {
  const sessionHeld = opts?.sessionHeld ?? false;
  const interestOk = opts?.interestOk !== false;

  const finish = (next: AnalyzerPosition) =>
    sameCardPricing(pos, next) ? pos : { ...next, updatedAt: Date.now() };

  if (!pos.visible) {
    return finish({
      ...pos,
      liveState: "not_live",
    });
  }

  if (!interestOk) {
    return finish({
      ...pos,
      liveState: "budget_refused",
      livePackagePerShare: null,
      priceSide: null,
    });
  }

  if (quote.skew_fail || quote.epoch_quality === "skewed_fail") {
    return finish({
      ...pos,
      liveState: "skewed",
      livePackagePerShare: null,
      priceSide: null,
      maxSkewMs: quote.max_skew_ms ?? null,
      epochQuality: quote.epoch_quality ?? "skewed",
    });
  }

  if (!quote.complete || quote.package_debit_per_share == null) {
    return finish({
      ...pos,
      liveState: "incomplete",
      livePackagePerShare: null,
      priceSide: null,
      lastNatSigned: null,
      displayAsOf: quote.as_of ?? pos.displayAsOf,
      maxSkewMs: quote.max_skew_ms ?? null,
      epochQuality: quote.epoch_quality ?? null,
      // keep last bind snapshot if present
    });
  }

  const nat = Number(quote.package_debit_per_share);
  const hashes: Record<string, string> = {};
  let asOf = quote.as_of ?? null;
  if (quote.generations_used) {
    for (const [exp, meta] of Object.entries(quote.generations_used)) {
      if (meta?.content_hash) hashes[exp] = meta.content_hash;
      if (!asOf && meta?.as_of) asOf = meta.as_of;
    }
  }

  if (pos.lock.mode === "locked") {
    const dStar = pos.lock.packageDebitPerShare;
    return finish({
      ...pos,
      lastNatSigned: nat,
      livePackagePerShare: Math.abs(dStar),
      priceSide: dStar > 0 ? "debit" : dStar < 0 ? "credit" : pos.priceSide,
      liveState: sessionHeld ? "held" : "live",
      displayAsOf: asOf,
      contentHashes: hashes,
      maxSkewMs: quote.max_skew_ms ?? null,
      epochQuality: quote.epoch_quality ?? null,
      // Successful OPF package implies bindable at quote time
      bind: pos.bind
        ? { ...pos.bind, bindable: true, failedCount: 0, summary: "bound" }
        : pos.bind,
    });
  }

  const next: AnalyzerPosition = {
    ...pos,
    lastNatSigned: nat,
    livePackagePerShare: Math.abs(nat),
    // OPF package_debit_per_share: +debit / −credit
    priceSide: nat > 0 ? "debit" : nat < 0 ? "credit" : null,
    liveState: sessionHeld ? "held" : "live",
    displayAsOf: asOf,
    contentHashes: hashes,
    maxSkewMs: quote.max_skew_ms ?? null,
    epochQuality: quote.epoch_quality ?? null,
    bind: pos.bind
      ? { ...pos.bind, bindable: true, failedCount: 0, summary: "bound" }
      : pos.bind,
  };
  // B5 invariant — fail loud in dev if drift
  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV !== "production" &&
    !packageMagnitudeInvariantHolds(next)
  ) {
    console.error("package magnitude invariant broken", next.id, next);
  }
  return finish(next);
}

export function lockNatural(pos: AnalyzerPosition): AnalyzerPosition {
  if (pos.lastNatSigned == null || pos.liveState === "incomplete") {
    throw new Error("cannot lock natural: incomplete package");
  }
  return {
    ...pos,
    lock: {
      mode: "locked",
      lockedAt: new Date().toISOString(),
      packageDebitPerShare: pos.lastNatSigned,
      lockSource: "natural_mid",
      freezeIv: false,
      freezeMarks: false,
      generationHashesAtLock: { ...pos.contentHashes },
    },
    livePackagePerShare: Math.abs(pos.lastNatSigned),
    priceSide:
      pos.lastNatSigned > 0
        ? "debit"
        : pos.lastNatSigned < 0
          ? "credit"
          : null,
    updatedAt: Date.now(),
  };
}

/** limitMagnitude > 0; isCredit true → negative D* */
export function lockLimit(
  pos: AnalyzerPosition,
  limitMagnitude: number,
  isCredit: boolean,
  source: LockSource = "user_limit",
): AnalyzerPosition {
  const mag = Math.abs(limitMagnitude);
  const signed = isCredit ? -mag : mag;
  return {
    ...pos,
    lock: {
      mode: "locked",
      lockedAt: new Date().toISOString(),
      packageDebitPerShare: signed,
      lockSource: source,
      freezeIv: false,
      freezeMarks: false,
      generationHashesAtLock: { ...pos.contentHashes },
    },
    livePackagePerShare: mag,
    priceSide: isCredit ? "credit" : "debit",
    position: {
      ...pos.position,
      net_debit_override: mag,
      direction: isCredit ? "sell" : "buy",
    },
    updatedAt: Date.now(),
  };
}

export function unlockCard(pos: AnalyzerPosition): AnalyzerPosition {
  return {
    ...pos,
    lock: { mode: "unlocked" },
    updatedAt: Date.now(),
  };
}

/**
 * ToS-style BUY/SELL flip on the structure header.
 * Flips every leg side, package direction, and debit↔credit polarity.
 */
export function flipCardDirection(pos: AnalyzerPosition): AnalyzerPosition {
  const nextDir =
    pos.position.direction === "sell" ? ("buy" as const) : ("sell" as const);
  const legs = pos.position.legs.map((leg) => ({
    ...leg,
    side: (leg.side === "long" ? "short" : "long") as "long" | "short",
  }));
  const position = {
    ...pos.position,
    legs,
    direction: nextDir,
  };
  const priceSide: "debit" | "credit" | null =
    pos.priceSide == null
      ? null
      : pos.priceSide === "debit"
        ? "credit"
        : "debit";
  const lastNatSigned =
    pos.lastNatSigned == null ? null : -pos.lastNatSigned;
  let lock = pos.lock;
  if (lock.mode === "locked") {
    lock = {
      ...lock,
      packageDebitPerShare: -lock.packageDebitPerShare,
    };
  }
  return {
    ...pos,
    position,
    label: buildLabel(position.underlying, legs, position.expiration),
    notation: buildNotation(legs),
    priceSide,
    lastNatSigned,
    // magnitude unchanged; side flipped
    livePackagePerShare: pos.livePackagePerShare,
    lock,
    updatedAt: Date.now(),
  };
}

/** Set structure direction explicitly (BUY or SELL). No-op if already that side. */
export function setCardDirection(
  pos: AnalyzerPosition,
  direction: "buy" | "sell",
): AnalyzerPosition {
  const cur = pos.position.direction === "sell" ? "sell" : "buy";
  if (cur === direction) return pos;
  return flipCardDirection(pos);
}

/**
 * ToS-style expiration roll — set package front exp from listed expirations.
 * Single-exp structures: all legs move.
 * Multi-exp (calendar/diagonal): shift each leg along the listed ladder by the
 * same step as front → new, when listedExps is provided.
 */
export function setCardExpiration(
  pos: AnalyzerPosition,
  newExpiration: string,
  listedExps?: readonly string[],
): AnalyzerPosition {
  const newE = newExpiration.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newE)) return pos;
  const oldFront = (
    pos.position.expiration ||
    pos.position.legs[0]?.expiration ||
    ""
  ).slice(0, 10);
  if (oldFront === newE) return pos;

  const sorted = (listedExps || [])
    .map((e) => e.slice(0, 10))
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e))
    .sort();
  const unique = new Set(
    pos.position.legs.map((l) =>
      (l.expiration || oldFront).slice(0, 10),
    ),
  );

  let legs = pos.position.legs.map((l) => ({ ...l }));
  if (unique.size <= 1 || sorted.length < 2) {
    legs = legs.map((l) => ({
      ...l,
      expiration: newE,
      entry_price: 0, // force live re-mark
    }));
  } else {
    const oldFrontIdx = sorted.indexOf(oldFront);
    const newIdx = sorted.indexOf(newE);
    const delta =
      oldFrontIdx >= 0 && newIdx >= 0 ? newIdx - oldFrontIdx : 0;
    const mapExp = (raw: string): string => {
      const ee = raw.slice(0, 10);
      if (ee === oldFront) return newE;
      if (delta === 0) return ee;
      const i = sorted.indexOf(ee);
      if (i < 0) return ee;
      const j = Math.min(sorted.length - 1, Math.max(0, i + delta));
      return sorted[j];
    };
    legs = legs.map((l) => ({
      ...l,
      expiration: mapExp(l.expiration || oldFront),
      entry_price: 0,
    }));
  }

  const position = {
    ...pos.position,
    expiration: newE,
    legs,
    // Clear any limit that was bound to the old option pointer
    net_debit_override: null,
  };

  /**
   * Card = pointer to an option structure, not the option itself.
   * Rebinding expiration (e.g. EXPIRED → live listed date) must:
   *  - clear the stale mark from the old option
   *  - unlock so OPF can re-quote natural debit/credit
   *  - set not_live until atomic package resolve settles once
   * UI shows UPDATING then a single final state (price / NOT TRADED / …).
   */
  return {
    ...pos,
    position,
    label: buildLabel(position.underlying, legs, newE),
    notation: buildNotation(legs),
    lock: { mode: "unlocked" },
    lastNatSigned: null,
    livePackagePerShare: null,
    priceSide: null,
    liveState: "not_live",
    displayAsOf: null,
    contentHashes: {},
    maxSkewMs: null,
    epochQuality: null,
    bind: null, // clear prior bind until atomic resolve completes
    updatedAt: Date.now(),
  };
}

/**
 * Fingerprint of the option the card points at (definition only).
 * Used to re-quote when the pointer moves (exp / strikes / sides) without
 * looping on live mark updates.
 */
export function cardDefinitionKey(pos: AnalyzerPosition): string {
  const p = pos.position;
  const legs = (p.legs || [])
    .map(
      (l) =>
        `${l.side}:${l.type}:${l.strike}:${l.quantity}:${(l.expiration || p.expiration || "").slice(0, 10)}`,
    )
    .join("|");
  return [
    pos.id,
    pos.visible ? "1" : "0",
    pos.lock.mode,
    (p.underlying || "").toUpperCase(),
    (p.expiration || "").slice(0, 10),
    p.direction || "buy",
    p.contracts || 1,
    legs,
  ].join("::");
}

/**
 * Front expiration the card currently points at (definition SoR).
 */
export function cardPointerExpiration(pos: AnalyzerPosition): string {
  return (
    pos.position.expiration ||
    pos.position.legs[0]?.expiration ||
    ""
  ).slice(0, 10);
}

/**
 * Calendar DTE for an option pointer (0 on expiry day until settlement cutoff).
 * Uses 16:00Z on the expiration calendar date as the “still alive” cutoff —
 * same law as the position list EXPIRED chip.
 */
export function calendarDteOf(
  expiration: string,
  now: Date = new Date(),
): number {
  if (!expiration) return 0;
  const e = new Date(expiration.slice(0, 10) + "T16:00:00Z");
  return Math.max(
    0,
    Math.ceil((e.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

/**
 * True when the pointed-to option is past settlement (card shows EXPIRED).
 * Independent of liveState / lock — pure calendar on the pointer.
 */
export function isOptionPointerExpired(
  expiration: string,
  now: Date = new Date(),
): boolean {
  if (!expiration || !/^\d{4}-\d{2}-\d{2}/.test(expiration)) return true;
  const e = new Date(expiration.slice(0, 10) + "T16:00:00Z");
  return e.getTime() <= now.getTime();
}

/**
 * Card display doctrine:
 *  - Pointer expired → EXPIRED (no package mark row)
 *  - Pointer not expired + OPF magnitude present (live or held) → show package
 * Market closed still shows magnitude when liveState is "held".
 */
export function cardShowsPackageMark(
  pos: AnalyzerPosition,
  now: Date = new Date(),
): boolean {
  const exp = cardPointerExpiration(pos);
  if (isOptionPointerExpired(exp, now)) return false;
  return (
    pos.livePackagePerShare != null &&
    Number.isFinite(pos.livePackagePerShare) &&
    pos.livePackagePerShare >= 0
  );
}

/**
 * Shift every leg one listed strike in the arrow direction (↑ higher, ↓ lower).
 *
 * Rigid structure: all legs must be able to step one index on their exp's
 * listed grid (or arithmetic fallback). If any leg is at the edge, no-op.
 *
 * **Always unlocks** the package so debit/credit can re-find its natural mid
 * — regardless of prior lock / limit override.
 */
export function shiftCardStrikes(
  pos: AnalyzerPosition,
  direction: "up" | "down",
  getListedStrikes?: (expiration: string) => readonly number[],
): AnalyzerPosition {
  const delta = direction === "up" ? 1 : -1;
  const front = (
    pos.position.expiration ||
    pos.position.legs[0]?.expiration ||
    ""
  ).slice(0, 10);
  if (!pos.position.legs.length) return pos;

  // Fallback arithmetic step from structure gaps (or 5)
  const uniqueStrikes = uniqueListedStrikes(
    pos.position.legs.map((l) => l.strike),
  );
  let fallbackStep = 5;
  if (uniqueStrikes.length >= 2) {
    const gaps = uniqueStrikes
      .slice(1)
      .map((s, i) => normalizeStrike(s - uniqueStrikes[i]))
      .filter((g) => g > 0);
    if (gaps.length) fallbackStep = Math.min(...gaps);
  }

  const nextLegs = pos.position.legs.map((leg) => {
    const exp = (leg.expiration || front).slice(0, 10);
    const rawListed = getListedStrikes?.(exp) ?? [];
    const listed = uniqueListedStrikes(rawListed);
    const cur = normalizeStrike(leg.strike);

    if (listed.length >= 2) {
      let idx = listed.findIndex((s) => normalizeStrike(s) === cur);
      if (idx < 0) {
        const snapped = snapToListed(cur, listed);
        idx =
          snapped != null
            ? listed.findIndex((s) => normalizeStrike(s) === normalizeStrike(snapped))
            : -1;
      }
      if (idx < 0) return { leg, next: cur, ok: false as const };
      const j = idx + delta;
      if (j < 0 || j >= listed.length) return { leg, next: cur, ok: false as const };
      return { leg, next: listed[j], ok: true as const };
    }

    // No ladder: rigid arithmetic translate
    const next = normalizeStrike(cur + delta * fallbackStep);
    if (!(next > 0)) return { leg, next: cur, ok: false as const };
    return { leg, next, ok: true as const };
  });

  // Rigid: every leg must move one step
  if (!nextLegs.every((r) => r.ok && r.next !== normalizeStrike(r.leg.strike))) {
    return pos;
  }

  const legs = nextLegs.map(({ leg, next }) => ({
    ...leg,
    strike: next,
    entry_price: 0, // force live re-mark
  }));

  const position: PositionInput = {
    ...pos.position,
    legs,
    net_debit_override: null,
  };

  return {
    ...pos,
    position,
    label: buildLabel(position.underlying, legs, position.expiration),
    notation: buildNotation(legs),
    // Unlock + clear stale package so natural mid can re-settle
    lock: { mode: "unlocked" },
    lastNatSigned: null,
    livePackagePerShare: null,
    priceSide: null,
    liveState:
      pos.liveState === "live" || pos.liveState === "held"
        ? "not_live"
        : pos.liveState === "incomplete" || pos.liveState === "skewed"
          ? pos.liveState
          : "not_live",
    updatedAt: Date.now(),
  };
}

export function loadAlerts(): AnalyzerThresholdAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const s = sessionStorage.getItem(ALERT_KEY);
    if (!s) return [];
    const arr = JSON.parse(s) as AnalyzerThresholdAlert[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: AnalyzerThresholdAlert[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
}

export function createPriceAlert(opts: {
  type: ThresholdAlertType;
  symbol: string;
  targetPrice: number;
  positionId?: string;
}): AnalyzerThresholdAlert {
  const verb =
    opts.type === "price_above"
      ? "rises above"
      : opts.type === "price_below"
        ? "falls below"
        : "touches";
  const color =
    opts.type === "price_above"
      ? "#22c55e"
      : opts.type === "price_below"
        ? "#ef4444"
        : "#3b82f6";
  return {
    id: uid("al"),
    type: opts.type,
    symbol: opts.symbol.toUpperCase(),
    targetPrice: opts.targetPrice,
    positionId: opts.positionId,
    title: `${opts.symbol} ${verb} ${opts.targetPrice.toFixed(0)}`,
    severity: "medium",
    status: "new",
    enabled: true,
    createdAt: new Date().toISOString(),
    color,
  };
}

export function evaluateAlerts(
  alerts: AnalyzerThresholdAlert[],
  spot: number,
  symbol: string,
): AnalyzerThresholdAlert[] {
  if (!(spot > 0)) return alerts;
  const sym = symbol.toUpperCase();
  let changed = false;
  const out = alerts.map((a) => {
    if (!a.enabled || a.status === "dismissed" || a.status === "triggered")
      return a;
    if (a.symbol && a.symbol !== sym) return a;
    let hit = false;
    if (a.type === "price_above" && spot >= a.targetPrice) hit = true;
    if (a.type === "price_below" && spot <= a.targetPrice) hit = true;
    if (a.type === "price_touch" && Math.abs(spot - a.targetPrice) <= 0.5)
      hit = true;
    if (!hit) return a;
    changed = true;
    return {
      ...a,
      status: "triggered" as const,
      triggeredAt: new Date().toISOString(),
    };
  });
  return changed ? out : alerts;
}

/** Basis for OPF handoff: locked D* or live natural. */
export function basisSigned(pos: AnalyzerPosition): number | null {
  if (pos.lock.mode === "locked") return pos.lock.packageDebitPerShare;
  return pos.lastNatSigned;
}
