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
    priceSide: p.priceSide === undefined ? "debit" : p.priceSide,
    visible: p.visible !== false,
    lock: p.lock?.mode === "locked" ? p.lock : { mode: "unlocked" },
    liveState: p.liveState || "not_live",
    displayAsOf: p.displayAsOf ?? null,
    contentHashes: p.contentHashes || {},
    maxSkewMs: p.maxSkewMs ?? null,
    epochQuality: p.epochQuality ?? null,
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
  const net = positionNetPremium(input);
  const override = input.net_debit_override;
  let signed: number | null = null;
  if (override != null && Number.isFinite(override)) {
    const mag = Math.abs(override);
    signed = input.direction === "sell" || net > 0 ? -mag : mag;
  } else if (Number.isFinite(net)) {
    signed = net;
  }
  const priceSide: "debit" | "credit" | null =
    signed == null
      ? null
      : signed >= 0
        ? "debit"
        : "credit";
  return {
    id: uid("pos"),
    label: buildLabel(input.underlying, input.legs, input.expiration),
    notation: buildNotation(input.legs),
    position: {
      ...input,
      legs: input.legs.map((l) => ({ ...l })),
    },
    status: "ANALYSIS",
    livePackagePerShare: signed != null ? Math.abs(signed) : null,
    lastNatSigned: signed,
    priceSide,
    visible: true,
    lock: { mode: "unlocked" },
    liveState: "not_live",
    displayAsOf: null,
    contentHashes: {},
    maxSkewMs: null,
    epochQuality: null,
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
      priceSide: dStar >= 0 ? "debit" : "credit",
      liveState: sessionHeld ? "held" : "live",
      displayAsOf: asOf,
      contentHashes: hashes,
      maxSkewMs: quote.max_skew_ms ?? null,
      epochQuality: quote.epoch_quality ?? null,
    });
  }

  const next: AnalyzerPosition = {
    ...pos,
    lastNatSigned: nat,
    livePackagePerShare: Math.abs(nat),
    priceSide: nat >= 0 ? "debit" : "credit",
    liveState: sessionHeld ? "held" : "live",
    displayAsOf: asOf,
    contentHashes: hashes,
    maxSkewMs: quote.max_skew_ms ?? null,
    epochQuality: quote.epoch_quality ?? null,
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
    priceSide: pos.lastNatSigned >= 0 ? "debit" : "credit",
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
