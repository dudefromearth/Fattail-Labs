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
import { defaultSessionEntryAt } from "@/lib/options-lab/positionSession";

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
  /**
   * OPF package mark mode (pre-open held/theo vs live NBBO).
   * When set to pre_open_*, UI must show markDisclaimer.
   */
  markMode?: string | null;
  /** OPF member disclaimer — theoretical until market opens */
  markDisclaimer?: string | null;
  /** From OPF PackageQuote when unlocked live; basis magnitude when locked */
  livePackagePerShare: number | null;
  /** Signed natural from last OPF quote (for lock natural / parity) */
  lastNatSigned: number | null;
  /**
   * Durable defined debit/credit (OPF sign: +debit / −credit).
   * Written on create / quote / lock. Never cleared by expire or bind fail.
   * Ghost residual and the expired price cell use this — not a rebuilt mark.
   */
  definedDebitPerShare?: number | null;
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
  /**
   * When the position was put on (session clock). Configurable.
   * If unset, beginning of the cash session (9:30 AM ET).
   */
  entryAt?: number;
  /**
   * Close is a transaction, not a pre-set clock. Stamped when the member
   * closes. Absent while the position is open.
   */
  closedAt?: number | null;
  /** Book mark P&L (OPF sign, per share) frozen at the close transaction. */
  closedPnl?: number | null;
  /**
   * Optional Trade Log TO_OPEN id. Linking is a choice — not required.
   * If set, a Trade Log close on that open stamps this position closed.
   */
  tradeLogTradeId?: number | null;
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

/** Canvas = price on the plot. Position = bound to one Shown card. */
export type AnalyzerAlertKind = "canvas" | "position";

/** Member + evaluation run state — list chip + Builder. */
export type AlertRunState = "idle" | "live" | "touched";

export function normalizeAlertRunState(
  raw: unknown,
  enabled?: boolean,
  status?: string,
): AlertRunState {
  if (raw === "idle" || raw === "live" || raw === "touched") return raw;
  if (raw === "running") return "live";
  if (raw === "tripped") return "touched";
  if (raw === "paused") return "idle";
  if (status === "triggered") return "touched";
  if (enabled === false) return "idle";
  return "live";
}

export function toggleAlertRunState(state: AlertRunState): AlertRunState {
  return state === "live" ? "idle" : "live";
}

export function alertIsArmed(state: AlertRunState): boolean {
  return state === "live";
}

/** Member-facing when a Live alert was touched. Empty if the stamp is missing. */
export function formatAlertTouchedContext(opts: {
  at?: string | null;
  spot?: number | null;
  nowMs?: number;
}): string {
  const ms = opts.at ? Date.parse(opts.at) : NaN;
  if (!Number.isFinite(ms)) return "";
  const zone = "America/New_York";
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(ms))
    .replace(/\s/g, " ");
  const day = (t: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date(t));
  const sameDay = day(ms) === day(opts.nowMs ?? Date.now());
  const when = sameDay
    ? `${time} ET`
    : `${new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        month: "short",
        day: "numeric",
      }).format(new Date(ms))}, ${time} ET`;
  if (opts.spot != null && Number.isFinite(opts.spot)) {
    return `${when} at ${Math.round(opts.spot)}`;
  }
  return when;
}

export function applyAlertRunState(
  alert: AnalyzerThresholdAlert,
  next: AlertRunState,
): AnalyzerThresholdAlert {
  const keepTouch = next === "touched";
  return {
    ...alert,
    runState: next,
    enabled: next === "live",
    status: next === "touched" ? "triggered" : "new",
    triggeredAt: keepTouch ? alert.triggeredAt : undefined,
    triggeredSpot: keepTouch ? alert.triggeredSpot : undefined,
  };
}

export type AnalyzerThresholdAlert = {
  id: string;
  kind: AnalyzerAlertKind;
  type: ThresholdAlertType;
  symbol: string;
  targetPrice: number;
  positionId?: string;
  /** Strike notation for Position alerts, e.g. 6700C/6720C/6740C */
  positionLabel?: string;
  /** False for P&L / greek thresholds — do not draw an underlier vertical. */
  targetIsUnderlier?: boolean;
  title: string;
  severity: ThresholdSeverity;
  status: ThresholdAlertStatus;
  runState: AlertRunState;
  enabled: boolean;
  createdAt: string;
  triggeredAt?: string;
  /** Underlier print that moved Live → Touched. */
  triggeredSpot?: number;
  color: string;
  alertClass?: "threshold" | "algo";
  algoPhase?: "waiting" | "armed" | "recorded";
  algo?: {
    variant: "otm_fly_trail";
    entry_pct: number;
    trail_start_pct: number;
    trail_floor_pct: number;
    decay_end?: "eod" | string;
    trail_stop_reason?: string;
    trail_end_reason?: string;
    /** What-if Spot / Time / Vol drive the trail (FI-033). */
    demo?: boolean;
    trail_state?: import("./algoTrailMath").AlgoTrailState;
    remaining_at_arm?: number;
    e_at_arm?: number | null;
    prev_spot?: number;
    overlay: boolean;
    high_water_color: string;
    trail_color: string;
  };
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
    definedDebitPerShare: backfillDefinedDebit({
      definedDebitPerShare: p.definedDebitPerShare,
      lock: p.lock?.mode === "locked" ? p.lock : { mode: "unlocked" },
      lastNatSigned: p.lastNatSigned ?? null,
      livePackagePerShare: p.livePackagePerShare ?? null,
      priceSide:
        p.priceSide === "debit" || p.priceSide === "credit"
          ? p.priceSide
          : null,
      position: p.position,
    }),
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
    entryAt:
      p.entryAt != null && Number.isFinite(p.entryAt)
        ? p.entryAt
        : defaultSessionEntryAt(p.createdAt || Date.now()),
    closedAt:
      p.closedAt != null && Number.isFinite(p.closedAt) ? p.closedAt : null,
    closedPnl:
      p.closedPnl != null && Number.isFinite(p.closedPnl) ? p.closedPnl : null,
    tradeLogTradeId:
      p.tradeLogTradeId != null && Number.isFinite(p.tradeLogTradeId)
        ? Number(p.tradeLogTradeId)
        : null,
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now(),
  };
}

export function loadPositions(): AnalyzerPosition[] {
  if (typeof window === "undefined") return [];
  try {
    const sess =
      sessionStorage.getItem(POS_KEY) ||
      sessionStorage.getItem("ft_options_lab_analyzer_positions_v1");
    let s = localStorage.getItem(POS_KEY) || sess;
    if (!localStorage.getItem(POS_KEY) && sess) {
      try {
        localStorage.setItem(POS_KEY, sess);
      } catch {
        /* ignore */
      }
    }
    if (!s) return [];
    const arr = JSON.parse(s) as unknown[];
    if (!Array.isArray(arr)) return [];
    return arr.map(migratePos).filter(Boolean) as AnalyzerPosition[];
  } catch {
    return [];
  }
}

export const ANALYZER_BOOK_EVENT = "ftl-analyzer-book";
const POS_REV_KEY = "ft_options_lab_analyzer_positions_rev";

export function savePositions(positions: AnalyzerPosition[]): void {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(positions);
  sessionStorage.setItem(POS_KEY, json);
  try {
    localStorage.setItem(POS_KEY, json);
    localStorage.setItem(POS_REV_KEY, String(Date.now()));
  } catch {
    /* quota / private mode */
  }
  // Drop legacy key so an empty book is not re-hydrated from v1 after delete.
  try {
    sessionStorage.removeItem("ft_options_lab_analyzer_positions_v1");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(ANALYZER_BOOK_EVENT));
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
    definedDebitPerShare: lastNatSigned,
    priceSide,
    visible: true,
    lock: { mode: "unlocked" },
    liveState: "not_live",
    displayAsOf: null,
    contentHashes: {},
    maxSkewMs: null,
    epochQuality: null,
    bind: null,
    entryAt: defaultSessionEntryAt(),
    closedAt: null,
    closedPnl: null,
    tradeLogTradeId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Live package mark in OPF sign (+debit / −credit). */
export function liveSignedMark(pos: AnalyzerPosition): number | null {
  if (pos.lastNatSigned != null && Number.isFinite(pos.lastNatSigned)) {
    return pos.lastNatSigned;
  }
  if (
    pos.livePackagePerShare != null &&
    Number.isFinite(pos.livePackagePerShare)
  ) {
    if (pos.priceSide === "credit") return -Math.abs(pos.livePackagePerShare);
    if (pos.priceSide === "debit") return Math.abs(pos.livePackagePerShare);
  }
  return definedDebitSigned(pos);
}

/** Book P&L vs defined debit (a mark, not a broker fill). */
export function bookPnlSigned(pos: AnalyzerPosition): number | null {
  if (
    pos.closedAt != null &&
    pos.closedPnl != null &&
    Number.isFinite(pos.closedPnl)
  ) {
    return pos.closedPnl;
  }
  const entry = definedDebitSigned(pos);
  const live = liveSignedMark(pos);
  if (entry == null || live == null) return null;
  return live - entry;
}

/**
 * Close transaction: stamp the clock and freeze the book mark.
 * A close time cannot exist before this runs.
 */
export function closePosition(
  pos: AnalyzerPosition,
  nowMs = Date.now(),
): AnalyzerPosition {
  if (pos.closedAt != null && Number.isFinite(pos.closedAt)) return pos;
  return {
    ...pos,
    closedAt: nowMs,
    closedPnl: bookPnlSigned(pos),
    updatedAt: nowMs,
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
    (a.markMode ?? null) === (b.markMode ?? null) &&
    (a.markDisclaimer ?? null) === (b.markDisclaimer ?? null) &&
    JSON.stringify(a.contentHashes) === JSON.stringify(b.contentHashes)
  );
}

/** True when the card is still on pre-open / held marks (not market-truth NBBO). */
export function cardNeedsMarketTruth(pos: AnalyzerPosition): boolean {
  if (!pos.visible) return false;
  if (typeof pos.markMode === "string" && pos.markMode.startsWith("pre_open")) {
    return true;
  }
  if (pos.markMode === "mixed") return true;
  if (pos.liveState === "held") return true;
  return false;
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
    mark_mode?: string | null;
    mark_disclaimer?: string | null;
    basis_source?: string | null;
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
      markMode: quote.mark_mode ?? null,
      markDisclaimer: quote.mark_disclaimer ?? null,
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

  const markMode = quote.mark_mode ?? null;
  const markDisclaimer = quote.mark_disclaimer ?? null;
  // Pre-open OPF marks are held/theo even if wall clock session later opens
  const preOpen =
    typeof markMode === "string" && markMode.startsWith("pre_open");
  const liveState: LiveState = preOpen
    ? "held"
    : sessionHeld
      ? "held"
      : "live";

  if (pos.lock.mode === "locked") {
    const dStar = pos.lock.packageDebitPerShare;
    return finish({
      ...pos,
      lastNatSigned: nat,
      definedDebitPerShare: dStar,
      livePackagePerShare: Math.abs(dStar),
      priceSide: dStar > 0 ? "debit" : dStar < 0 ? "credit" : pos.priceSide,
      liveState,
      displayAsOf: asOf,
      contentHashes: hashes,
      maxSkewMs: quote.max_skew_ms ?? null,
      epochQuality: quote.epoch_quality ?? null,
      markMode,
      markDisclaimer,
      // Successful OPF package implies bindable at quote time
      bind: pos.bind
        ? { ...pos.bind, bindable: true, failedCount: 0, summary: "bound" }
        : pos.bind,
    });
  }

  const next: AnalyzerPosition = {
    ...pos,
    lastNatSigned: nat,
    definedDebitPerShare: nat,
    livePackagePerShare: Math.abs(nat),
    // OPF package_debit_per_share: +debit / −credit
    priceSide: nat > 0 ? "debit" : nat < 0 ? "credit" : null,
    liveState,
    displayAsOf: asOf,
    contentHashes: hashes,
    maxSkewMs: quote.max_skew_ms ?? null,
    epochQuality: quote.epoch_quality ?? null,
    markMode,
    markDisclaimer,
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
    definedDebitPerShare: pos.lastNatSigned,
    priceSide:
      pos.lastNatSigned > 0
        ? "debit"
        : pos.lastNatSigned < 0
          ? "credit"
          : null,
    position: {
      ...pos.position,
      net_debit_override: null,
    },
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
    definedDebitPerShare: signed,
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
  const nat = pos.lastNatSigned;
  const hasNat = nat != null && Number.isFinite(nat);
  return {
    ...pos,
    lock: { mode: "unlocked" },
    livePackagePerShare: hasNat ? Math.abs(nat) : null,
    definedDebitPerShare: hasNat ? nat : null,
    priceSide: hasNat
      ? nat > 0
        ? "debit"
        : nat < 0
          ? "credit"
          : pos.priceSide
      : pos.priceSide,
    position: {
      ...pos.position,
      net_debit_override: null,
    },
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
    definedDebitPerShare:
      pos.definedDebitPerShare == null ? null : -pos.definedDebitPerShare,
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
    definedDebitPerShare: null,
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
 * Eastern Time calendar date (YYYY-MM-DD) for a clock instant.
 * IANA zone America/New_York — EST or EDT. Analyzer “today vs expiration”
 * is this Eastern date — not UTC, not the member’s local zone, not 16:00Z.
 */
export function newYorkCalendarDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Calendar DTE for an option pointer.
 * 0 on the entire expiration calendar day in Eastern Time
 * (through 23:59:59 ET; flips at 00:00:00 Eastern the next day).
 */
export function calendarDteOf(
  expiration: string,
  now: Date = new Date(),
): number {
  if (!expiration) return 0;
  const exp = expiration.slice(0, 10);
  const today = newYorkCalendarDate(now);
  if (today > exp) return 0;
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${exp}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * True when the pointed-to option’s expiration **calendar day has ended**
 * in Eastern Time. Cutoff is **midnight Eastern Time**
 * (`00:00:00` America/New_York — EST or EDT). Not UTC midnight, not the
 * member’s local midnight, not cash close / 16:00Z.
 * The card stays current through 23:59:59 ET of the expiration date.
 * At 00:00:00 ET the next calendar day a still-shown card is EXPIRED
 * and the viewport uses ghost residual.
 */
export function isOptionPointerExpired(
  expiration: string,
  now: Date = new Date(),
): boolean {
  if (!expiration || !/^\d{4}-\d{2}-\d{2}/.test(expiration)) return true;
  return newYorkCalendarDate(now) > expiration.slice(0, 10);
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
 * Shift every leg one **listed** strike in the arrow direction (↑ higher, ↓ lower).
 *
 * OT-EF / DL-309: OPF-held dual-side grid only. **No arithmetic invent** when
 * the ladder is cold or a leg cannot step — rigid no-op (position unchanged).
 * If any leg cannot move one listed step, the whole structure stays put.
 *
 * **Always unlocks** and clears package so atomic resolve can re-bind.
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
  if (!getListedStrikes) return pos; // cannot prove OPF-listed without ladder

  const nextLegs = pos.position.legs.map((leg) => {
    const exp = (leg.expiration || front).slice(0, 10);
    const listed = uniqueListedStrikes(getListedStrikes(exp) ?? []);
    const cur = normalizeStrike(leg.strike);

    // Doctrine: without a real listed grid, refuse to invent steps
    if (listed.length < 2) {
      return { leg, next: cur, ok: false as const };
    }

    let idx = listed.findIndex((s) => normalizeStrike(s) === cur);
    if (idx < 0) {
      const snapped = snapToListed(cur, listed);
      idx =
        snapped != null
          ? listed.findIndex(
              (s) => normalizeStrike(s) === normalizeStrike(snapped),
            )
          : -1;
    }
    if (idx < 0) return { leg, next: cur, ok: false as const };
    const j = idx + delta;
    if (j < 0 || j >= listed.length) {
      return { leg, next: cur, ok: false as const };
    }
    return { leg, next: listed[j], ok: true as const };
  });

  // Rigid: every leg must move one listed step
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
    lock: { mode: "unlocked" },
    lastNatSigned: null,
    definedDebitPerShare: null,
    livePackagePerShare: null,
    priceSide: null,
    bind: null,
    liveState: "not_live",
    displayAsOf: null,
    contentHashes: {},
    updatedAt: Date.now(),
  };
}

/** Move the whole structure `steps` listed strikes. Stops at the chain edge. */
export function shiftCardStrikesBySteps(
  pos: AnalyzerPosition,
  steps: number,
  getListedStrikes?: (expiration: string) => readonly number[],
): AnalyzerPosition {
  const n = Math.trunc(steps);
  if (!n || !getListedStrikes) return pos;
  const dir = n > 0 ? "up" : "down";
  let cur = pos;
  for (let i = 0; i < Math.abs(n); i++) {
    const next = shiftCardStrikes(cur, dir, getListedStrikes);
    if (next === cur) return cur;
    cur = next;
  }
  return cur;
}

export function loadAlerts(): AnalyzerThresholdAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const s = sessionStorage.getItem(ALERT_KEY);
    if (!s) return [];
    const arr = JSON.parse(s) as AnalyzerThresholdAlert[];
    if (!Array.isArray(arr)) return [];
    return arr.map((a) => {
      const runState = normalizeAlertRunState(
        a.runState,
        a.enabled,
        a.status,
      );
      return {
        ...a,
        kind: a.kind ?? (a.positionId ? "position" : "canvas"),
        runState,
        enabled: alertIsArmed(runState),
      };
    });
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: AnalyzerThresholdAlert[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
}

export function alertVerb(type: ThresholdAlertType): string {
  if (type === "price_above") return "rises above";
  if (type === "price_below") return "falls below";
  return "touches";
}

export function alertConditionMet(
  alert: AnalyzerThresholdAlert,
  spot: number,
  symbol: string,
): boolean {
  const armed = alertIsArmed(
    normalizeAlertRunState(alert.runState, alert.enabled, alert.status),
  );
  if (!armed || alert.status === "dismissed") return false;
  if (alert.kind === "position" && !alert.positionId) return false;
  if (!(spot > 0)) return false;
  if (alert.symbol && alert.symbol !== symbol.toUpperCase()) return false;
  if (alert.type === "price_above") return spot >= alert.targetPrice;
  if (alert.type === "price_below") return spot <= alert.targetPrice;
  return Math.abs(spot - alert.targetPrice) <= 0.5;
}

export function positionStrikeAlertLabel(pos: AnalyzerPosition): string {
  const legs = [...(pos.position.legs || [])].sort(
    (a, b) => a.strike - b.strike,
  );
  if (!legs.length) return pos.notation || pos.label;
  return legs
    .map((l) => `${l.strike}${l.type === "call" ? "C" : "P"}`)
    .join("/");
}

export function createPriceAlert(opts: {
  type: ThresholdAlertType;
  symbol: string;
  targetPrice: number;
  kind?: AnalyzerAlertKind;
  positionId?: string;
  positionLabel?: string;
  targetIsUnderlier?: boolean;
  color?: string;
  id?: string;
  runState?: AlertRunState;
}): AnalyzerThresholdAlert {
  const verb = alertVerb(opts.type);
  const kind: AnalyzerAlertKind =
    opts.kind ?? (opts.positionId ? "position" : "canvas");
  const color =
    opts.color ||
    (opts.type === "price_above"
      ? "#22c55e"
      : opts.type === "price_below"
        ? "#ef4444"
        : "#3b82f6");
  const px = opts.targetPrice.toFixed(0);
  const title =
    kind === "position" && opts.positionLabel
      ? `${opts.positionLabel} ${verb} ${px}`
      : `${opts.symbol} ${verb} ${px}`;
  return {
    id: opts.id || uid("al"),
    kind,
    type: opts.type,
    symbol: opts.symbol.toUpperCase(),
    targetPrice: opts.targetPrice,
    positionId: opts.positionId,
    positionLabel: opts.positionLabel,
    targetIsUnderlier: opts.targetIsUnderlier ?? true,
    title,
    severity: "medium",
    status: "new",
    runState: opts.runState ?? "live",
    enabled: alertIsArmed(opts.runState ?? "live"),
    createdAt: new Date().toISOString(),
    color,
  };
}

export function createAlgoAlert(opts: {
  symbol: string;
  positionId: string;
  positionLabel?: string;
  color: string;
  trailColor: string;
  entryPct: number;
  trailStartPct: number;
  trailFloorPct: number;
  decayEnd?: "eod" | string;
  trailStopReason?: string;
  trailEndReason?: string;
  demo?: boolean;
  overlay: boolean;
  runState?: AlertRunState;
  id?: string;
}): AnalyzerThresholdAlert {
  const title = `${opts.symbol} OTM fly trail`;
  return {
    id: opts.id || uid("al"),
    kind: "position",
    type: "price_touch",
    symbol: opts.symbol.toUpperCase(),
    targetPrice: 0,
    positionId: opts.positionId,
    positionLabel: opts.positionLabel,
    targetIsUnderlier: false,
    title,
    severity: "medium",
    status: "new",
    runState: opts.runState ?? "live",
    enabled: alertIsArmed(opts.runState ?? "live"),
    createdAt: new Date().toISOString(),
    color: opts.color,
    alertClass: "algo",
    algoPhase: "waiting",
    algo: {
      variant: "otm_fly_trail",
      entry_pct: opts.entryPct,
      trail_start_pct: opts.trailStartPct,
      trail_floor_pct: opts.trailFloorPct,
      decay_end: opts.decayEnd ?? "eod",
      trail_stop_reason: opts.trailStopReason,
      trail_end_reason: opts.trailEndReason,
      demo: opts.demo === true,
      overlay: opts.overlay,
      high_water_color: opts.color,
      trail_color: opts.trailColor,
    },
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
    if (a.status === "dismissed") return a;
    const state = normalizeAlertRunState(a.runState, a.enabled, a.status);
    if (state !== "live") return a;
    if (a.symbol && a.symbol !== sym) return a;
    if (a.alertClass === "algo") return a;
    let hit = false;
    if (a.type === "price_above" && spot >= a.targetPrice) hit = true;
    if (a.type === "price_below" && spot <= a.targetPrice) hit = true;
    if (a.type === "price_touch" && Math.abs(spot - a.targetPrice) <= 0.5)
      hit = true;
    if (!hit) return a;
    changed = true;
    return {
      ...a,
      runState: "touched" as const,
      enabled: false,
      status: "triggered" as const,
      triggeredAt: new Date().toISOString(),
      triggeredSpot: spot,
    };
  });
  return changed ? out : alerts;
}

/** Basis for OPF handoff: locked D* or live natural. */
export function basisSigned(pos: AnalyzerPosition): number | null {
  if (pos.lock.mode === "locked") return pos.lock.packageDebitPerShare;
  return pos.lastNatSigned;
}

/**
 * Debit/credit that was defined for this pointer (OPF sign).
 * Survives expire. Used by ghost residual and the expired price cell.
 */
export function definedDebitSigned(pos: AnalyzerPosition): number | null {
  if (
    pos.definedDebitPerShare != null &&
    Number.isFinite(pos.definedDebitPerShare)
  ) {
    return pos.definedDebitPerShare;
  }
  return backfillDefinedDebit(pos);
}

function backfillDefinedDebit(
  pos: Pick<
    AnalyzerPosition,
    | "definedDebitPerShare"
    | "lock"
    | "lastNatSigned"
    | "livePackagePerShare"
    | "priceSide"
    | "position"
  >,
): number | null {
  if (
    pos.definedDebitPerShare != null &&
    Number.isFinite(pos.definedDebitPerShare)
  ) {
    return pos.definedDebitPerShare;
  }
  if (pos.lock?.mode === "locked") {
    const d = pos.lock.packageDebitPerShare;
    if (Number.isFinite(d)) return d;
  }
  if (pos.lastNatSigned != null && Number.isFinite(pos.lastNatSigned)) {
    return pos.lastNatSigned;
  }
  if (
    pos.livePackagePerShare != null &&
    Number.isFinite(pos.livePackagePerShare)
  ) {
    if (pos.priceSide === "credit") return -Math.abs(pos.livePackagePerShare);
    if (pos.priceSide === "debit") return Math.abs(pos.livePackagePerShare);
  }
  const override = pos.position?.net_debit_override;
  if (override != null && Number.isFinite(override) && override !== 0) {
    const mag = Math.abs(override);
    return pos.position.direction === "sell" ? -mag : mag;
  }
  if (pos.position?.legs?.length) {
    const netMsc = positionNetPremium(pos.position);
    if (Number.isFinite(netMsc) && netMsc !== 0) return -netMsc;
  }
  return null;
}
