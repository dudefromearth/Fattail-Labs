/**
 * Analyzer position book + threshold alerts (session persistence).
 * Labs-owned — modeled on MSC Risk Graph list/alert UX, no MSC runtime.
 */

import type { PositionInput } from "@/lib/options-lab/positionTypes";
import {
  buildLabel,
  buildNotation,
} from "@/lib/options-lab/positionLabels";
import { positionNetPremium } from "@/lib/options-lab/positionToTrade";

export type AnalyzerTradeStatus =
  | "ANALYSIS"
  | "PENDING"
  | "OPEN"
  | "PARTIAL_OPEN"
  | "CLOSED"
  | "CANCELLED"
  | "REJECTED";

export type AnalyzerPosition = {
  id: string;
  label: string;
  notation: string;
  position: PositionInput;
  status: AnalyzerTradeStatus;
  /** Live mid package (per share); updated from chain */
  livePackagePerShare: number | null;
  priceSide: "debit" | "credit";
  visible: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ThresholdAlertType = "price_above" | "price_below" | "price_touch";
export type ThresholdAlertStatus = "new" | "acknowledged" | "dismissed" | "triggered";
export type ThresholdSeverity = "info" | "low" | "medium" | "high" | "critical";

export type AnalyzerThresholdAlert = {
  id: string;
  type: ThresholdAlertType;
  symbol: string;
  targetPrice: number;
  /** Optional position scope */
  positionId?: string;
  title: string;
  severity: ThresholdSeverity;
  status: ThresholdAlertStatus;
  enabled: boolean;
  createdAt: string;
  triggeredAt?: string;
  color: string;
};

const POS_KEY = "ft_options_lab_analyzer_positions_v1";
const ALERT_KEY = "ft_options_lab_analyzer_alerts_v1";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadPositions(): AnalyzerPosition[] {
  if (typeof window === "undefined") return [];
  try {
    const s = sessionStorage.getItem(POS_KEY);
    if (!s) return [];
    const arr = JSON.parse(s) as AnalyzerPosition[];
    return Array.isArray(arr) ? arr : [];
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
  const mag =
    override != null && Number.isFinite(override)
      ? Math.abs(override)
      : Math.abs(net);
  const isCredit =
    override != null
      ? input.direction === "sell" || net > 0
      : net > 0;
  return {
    id: uid("pos"),
    label: buildLabel(input.underlying, input.legs, input.expiration),
    notation: buildNotation(input.legs),
    position: {
      ...input,
      legs: input.legs.map((l) => ({ ...l })),
    },
    status: "ANALYSIS",
    livePackagePerShare: mag > 0 ? mag : null,
    priceSide: isCredit ? "credit" : "debit",
    visible: true,
    createdAt: Date.now(),
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

/** Evaluate threshold rules against current spot; returns updated list. */
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

export function packageMidFromLegs(
  legs: PositionInput["legs"],
  getMid: (exp: string, strike: number, type: "call" | "put") => number | null,
  defaultExp: string,
): number | null {
  let total = 0;
  let any = false;
  for (const leg of legs) {
    const exp = (leg.expiration || defaultExp).slice(0, 10);
    const mid = getMid(exp, leg.strike, leg.type);
    if (mid == null) return null;
    any = true;
    const sign = leg.side === "long" ? 1 : -1;
    total += sign * Math.abs(leg.quantity) * mid;
  }
  return any ? total : null;
}
