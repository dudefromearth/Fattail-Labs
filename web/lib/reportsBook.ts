/**
 * Reports book — equity (from starting capital), % drawdown, stats table.
 * Reference layout: chart.png (capital path + underlay drawdown + metric column).
 */

import type { Account, Trade } from "@/lib/tradeLog";
import {
  matchOpenClose,
  netCashPoints,
  tradeIsCloseFill,
  unitQty,
} from "@/lib/journalDayBook";

export type SeriesPoint = {
  t: string;
  /** Balance = starting capital + cumulative realized */
  equity: number;
  /** Drawdown as fraction of peak (≤ 0), e.g. -0.05995 */
  drawdownPct: number;
  peak: number;
  tradeIndex: number;
  /** Trade Log id when this point was produced by a fill (for deep-link highlight). */
  tradeId?: number;
};

export type StatRow = {
  key: string;
  label: string;
  value: string;
  /** highlight: yellow capital · blue key metrics · green balance · red loss */
  tone?: "capital" | "key" | "balance" | "loss" | "plain";
};

export type DistBin = {
  label: string;
  count: number;
  tone: -1 | 0 | 1;
};

export type ReportsBook = {
  accountLabel: string;
  startingCapital: number;
  series: SeriesPoint[];
  stats: StatRow[];
  distribution: DistBin[];
  strategyDist: DistBin[];
  tradeCount: number;
  hasPnlData: boolean;
  endBalance: number;
  maxDrawdownPct: number;
  /** Featured: avg winner vs avg loser (process asymmetry) */
  avgWin: number;
  avgLoss: number; // magnitude (positive)
  winLossRatio: number;
  winners: number;
  losers: number;
  /** Featured: trade-return Sharpe (mean/std × √n) */
  sharpe: number;
  sharpeSampleSize: number;
};

/** Options multiplier (SPX/SPXW-style). Equity uses 1. */
function multiplier(t: Trade): number {
  const ac = t.asset_class || t.legs?.[0]?.asset_class || "";
  if (ac === "equity" || ac === "stock") return 1;
  // Index options in this book are $100 point value
  return 100;
}

/**
 * Realized $ for a single fill when pnl_amount is set.
 * Opens usually return null (cost is not “realized” until close).
 */
export function realizedPnl(t: Trade): number | null {
  if (t.pnl_amount != null && !Number.isNaN(Number(t.pnl_amount))) {
    return Number(t.pnl_amount);
  }
  return null;
}

/**
 * Enrich closes missing pnl_amount using open→close cash.
 * ToS butterfly nets are per 1-2-1 unit; scale by max(open, close) unit size.
 * Example: open DEBIT 1.57 (3-wide) + close CREDIT 2.78 → ( -1.57 + 2.78 ) × 100 × 3 = $363.
 */
export function enrichTradesWithSyntheticPnl(trades: Trade[]): Trade[] {
  const byId = new Map(
    trades.map((t) => [t.id, { ...t, legs: t.legs ? [...t.legs] : [] }]),
  );
  const matched = matchOpenClose(trades);

  for (const m of matched) {
    if (!m.close) continue;
    const close = byId.get(m.close.id);
    if (!close) continue;
    if (close.pnl_amount != null && !Number.isNaN(Number(close.pnl_amount))) {
      continue;
    }
    const openPts = netCashPoints(m.open);
    const closePts = netCashPoints(m.close);
    if (openPts == null || closePts == null) continue;
    const scale = Math.max(unitQty(m.open), unitQty(m.close), 1);
    const synth = (openPts + closePts) * multiplier(m.close) * scale;
    close.pnl_amount = Math.round(synth * 100) / 100;
  }

  // Orphan closes: cash × mult × units (coarse; better than dropping)
  for (const t of byId.values()) {
    if (t.pnl_amount != null) continue;
    if (!tradeIsCloseFill(t)) continue;
    const pts = netCashPoints(t);
    if (pts == null) continue;
    t.pnl_amount =
      Math.round(pts * multiplier(t) * unitQty(t) * 100) / 100;
  }

  return [...byId.values()];
}

function money(n: number, parensNeg = false): string {
  if (parensNeg && n < 0) {
    return `($${Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })})`;
  }
  const sign = n < 0 ? "-$" : "$";
  return `${sign}${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pct(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

export function buildReportsBook(
  trades: Trade[],
  accounts: Account[],
  accountFilter: number | "all",
  startingCapital: number,
): ReportsBook {
  const enriched = enrichTradesWithSyntheticPnl(trades);
  const filtered =
    accountFilter === "all"
      ? enriched
      : enriched.filter((t) => t.account_id === accountFilter);

  const accountLabel =
    accountFilter === "all"
      ? "All accounts"
      : accounts.find((a) => a.id === accountFilter)?.label ||
        `Account ${accountFilter}`;

  const matched = matchOpenClose(filtered);
  const openCount = matched.filter((m) => m.close == null).length;

  const sorted = [...filtered].sort((a, b) => {
    const ta = a.exec_at || "";
    const tb = b.exec_at || "";
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.id - b.id;
  });

  let cum = 0;
  let peak = startingCapital;
  let maxDdPct = 0;
  const pnls: number[] = [];
  let grossProfit = 0;
  let grossLoss = 0; // positive magnitude of losses
  let winners = 0;
  let losers = 0;
  let sumWin = 0;
  let sumLoss = 0; // positive
  let largestWin = 0;
  let largestLoss = 0; // most negative
  let hasPnlData = false;

  const firstDay =
    sorted.length > 0 ? (sorted[0].exec_at || "").slice(0, 10) : "";
  const lastDay =
    sorted.length > 0
      ? (sorted[sorted.length - 1].exec_at || "").slice(0, 10)
      : "";
  let spanDays = 0;
  if (firstDay && lastDay) {
    const a = new Date(firstDay + "T12:00:00");
    const b = new Date(lastDay + "T12:00:00");
    spanDays = Math.max(
      0,
      Math.round((b.getTime() - a.getTime()) / 86400000),
    );
  }

  const series: SeriesPoint[] = [
    {
      t: firstDay || "start",
      equity: startingCapital,
      drawdownPct: 0,
      peak: startingCapital,
      tradeIndex: 0,
    },
  ];

  let tradeIndex = 0;
  for (const t of sorted) {
    const pnl = realizedPnl(t);
    if (pnl != null) {
      hasPnlData = true;
      cum += pnl;
      pnls.push(pnl);
      if (pnl > 0) {
        winners += 1;
        sumWin += pnl;
        grossProfit += pnl;
        largestWin = Math.max(largestWin, pnl);
      } else if (pnl < 0) {
        losers += 1;
        sumLoss += -pnl;
        grossLoss += -pnl;
        largestLoss = Math.min(largestLoss, pnl);
      }
    }
    tradeIndex += 1;
    const equity = startingCapital + cum;
    peak = Math.max(peak, equity);
    const ddPct = peak > 0 ? (equity - peak) / peak : 0;
    maxDdPct = Math.min(maxDdPct, ddPct);
    series.push({
      t: t.exec_at || String(t.id),
      equity,
      drawdownPct: ddPct,
      peak,
      tradeIndex,
      tradeId: t.id,
    });
  }

  // Keep full fill series (not daily collapse) so Journal deep-links can
  // land on the exact trade on the equity curve.

  const endBalance = startingCapital + cum;
  const netProfit = cum;
  const totalReturn =
    startingCapital > 0 ? (netProfit / startingCapital) * 100 : 0;
  const decided = winners + losers;
  const winRate = decided > 0 ? (winners / decided) * 100 : 0;
  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const avgWin = winners > 0 ? sumWin / winners : 0;
  const avgLoss = losers > 0 ? sumLoss / losers : 0; // positive
  const avgNet = pnls.length > 0 ? cum / pnls.length : 0;
  const ratioWinLoss = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  const winnerAsGross =
    grossProfit > 0 && largestWin > 0 ? (largestWin / grossProfit) * 100 : 0;
  const loserAsGross =
    grossLoss > 0 && largestLoss < 0
      ? (Math.abs(largestLoss) / grossLoss) * 100
      : 0;

  // Simple Sharpe-ish: mean/std of trade returns * sqrt(n) — rough
  let sharpe = 0;
  if (pnls.length > 1) {
    const mean = cum / pnls.length;
    const variance =
      pnls.reduce((s, p) => s + (p - mean) ** 2, 0) / (pnls.length - 1);
    const std = Math.sqrt(variance);
    sharpe = std > 0 ? (mean / std) * Math.sqrt(pnls.length) : 0;
  }

  // Avg risk proxy: mean |loss| among losers (or avg |pnl|)
  const avgRisk = losers > 0 ? avgLoss : pnls.length > 0 ? Math.abs(avgNet) : 0;
  const avgR2R = avgRisk > 0 ? avgWin / avgRisk : 0;

  const stats: StatRow[] = [
    {
      key: "span",
      label: "Span in Days",
      value: String(spanDays),
      tone: "plain",
    },
    {
      key: "capital",
      label: "Starting Capital",
      value: money(startingCapital),
      tone: "capital",
    },
    {
      key: "balance",
      label: "Balance",
      value: money(endBalance),
      tone: "balance",
    },
    {
      key: "return",
      label: "Total Return",
      value: hasPnlData ? pct(totalReturn) : "—",
      tone: "key",
    },
    {
      key: "gprofit",
      label: "Gross Profit",
      value: hasPnlData ? money(grossProfit) : "—",
      tone: "plain",
    },
    {
      key: "gloss",
      label: "Gross Loss",
      value: hasPnlData ? money(-grossLoss, true) : "—",
      tone: "loss",
    },
    {
      key: "net",
      label: "Net Profit",
      value: hasPnlData ? money(netProfit) : "—",
      tone: "plain",
    },
    {
      key: "pf",
      label: "Profit Factor",
      value: hasPnlData
        ? profitFactor === Infinity
          ? "∞"
          : profitFactor.toFixed(2)
        : "—",
      tone: "key",
    },
    {
      key: "trades",
      label: "Total Trade",
      value: String(filtered.length),
      tone: "plain",
    },
    {
      key: "winners",
      label: "Winners",
      value: String(winners),
      tone: "plain",
    },
    {
      key: "losers",
      label: "Losers",
      value: String(losers),
      tone: "plain",
    },
    {
      key: "winrate",
      label: "Win Rate",
      value: decided > 0 ? pct(winRate, 1) : "—",
      tone: "key",
    },
    {
      key: "avgrisk",
      label: "Avg Risk per trade",
      value: hasPnlData && avgRisk > 0 ? money(avgRisk) : "—",
      tone: "plain",
    },
    {
      key: "avgnet",
      label: "Avg Net Profit",
      value: hasPnlData && pnls.length > 0 ? money(avgNet) : "—",
      tone: "plain",
    },
    {
      key: "avgwin",
      label: "Avg Winning Trade",
      value: winners > 0 ? money(avgWin) : "—",
      tone: "plain",
    },
    {
      key: "avgloss",
      label: "Avg Losing Trade",
      value: losers > 0 ? money(-avgLoss, true) : "—",
      tone: "loss",
    },
    {
      key: "ratio",
      label: "Ratio Avg Win/Loss",
      value:
        decided > 0
          ? ratioWinLoss === Infinity
            ? "∞"
            : ratioWinLoss.toFixed(2)
          : "—",
      tone: "key",
    },
    {
      key: "lwin",
      label: "Largest Winner",
      value: winners > 0 ? money(largestWin) : "—",
      tone: "plain",
    },
    {
      key: "lloss",
      label: "Largest Loser",
      value: losers > 0 ? money(largestLoss, true) : "—",
      tone: "loss",
    },
    {
      key: "wgross",
      label: "Winner as % Gross",
      value: winners > 0 ? pct(winnerAsGross) : "—",
      tone: "plain",
    },
    {
      key: "lgross",
      label: "Loser as % Gross",
      value: losers > 0 ? pct(loserAsGross) : "—",
      tone: "plain",
    },
    {
      key: "maxdd",
      label: "Max Drawdown",
      value: hasPnlData ? pct(Math.abs(maxDdPct) * 100, 3) : "—",
      tone: "key",
    },
    {
      key: "r2r",
      label: "Average R2R",
      value: avgR2R > 0 ? avgR2R.toFixed(2) : "—",
      tone: "plain",
    },
    {
      key: "sharpe",
      label: "Sharpe Ratio",
      value: hasPnlData && pnls.length > 1 ? sharpe.toFixed(2) : "—",
      tone: "key",
    },
    {
      key: "open",
      label: "Open Positions",
      value: String(openCount),
      tone: "plain",
    },
  ];

  return {
    accountLabel,
    startingCapital,
    series,
    stats,
    distribution: buildPnlDistribution(pnls),
    strategyDist: buildStrategyDist(filtered),
    tradeCount: filtered.length,
    hasPnlData,
    endBalance,
    maxDrawdownPct: maxDdPct,
    avgWin,
    avgLoss,
    winLossRatio: ratioWinLoss === Infinity ? 99 : ratioWinLoss,
    winners,
    losers,
    sharpe,
    sharpeSampleSize: pnls.length,
  };
}

/** Match Coach spreadsheet histogram density (0DTE trade log). */
const OUTCOME_BIN_COUNT = 125;

/**
 * Equal-width $ histogram with 125 bins over the data range
 * (winsorized at 1st/99th percentile so one outlier doesn't collapse the body).
 * Makes right-skew readable: dense mass near modest wins, long positive tail.
 */
function buildPnlDistribution(pnls: number[]): DistBin[] {
  if (pnls.length === 0) {
    return Array.from({ length: OUTCOME_BIN_COUNT }, (_, i) => ({
      label: String(i),
      count: 0,
      tone: 0 as const,
    }));
  }

  const sorted = [...pnls].sort((a, b) => a - b);
  const pct = (p: number) => {
    const i = Math.min(
      sorted.length - 1,
      Math.max(0, Math.floor((p / 100) * sorted.length)),
    );
    return sorted[i];
  };
  // Soft clip tails for bin edges; still count every trade into edge bins
  let lo = pct(1);
  let hi = pct(99);
  if (hi <= lo) {
    lo = sorted[0];
    hi = sorted[sorted.length - 1];
  }
  if (hi <= lo) {
    hi = lo + 1;
  }

  const n = OUTCOME_BIN_COUNT;
  const width = (hi - lo) / n;
  const counts = new Array(n).fill(0) as number[];

  for (const p of pnls) {
    let idx: number;
    if (p <= lo) idx = 0;
    else if (p >= hi) idx = n - 1;
    else idx = Math.min(n - 1, Math.floor((p - lo) / width));
    counts[idx] += 1;
  }

  const fmt = (v: number) => {
    const a = Math.abs(v);
    const sign = v < 0 ? "−" : "";
    if (a >= 1000) return `${sign}${(a / 1000).toFixed(1)}k`;
    if (a >= 100) return `${sign}${Math.round(a)}`;
    return `${sign}${a.toFixed(0)}`;
  };

  const bins: DistBin[] = [];
  for (let i = 0; i < n; i++) {
    const edgeLo = lo + i * width;
    const edgeHi = lo + (i + 1) * width;
    const mid = (edgeLo + edgeHi) / 2;
    const tone: -1 | 0 | 1 = mid < -1e-9 ? -1 : mid > 1e-9 ? 1 : 0;
    // Sparse axis labels (every 10th + ends) to avoid clutter at 100 bars
    const label =
      i === 0 || i === n - 1 || i % 10 === 0
        ? fmt(edgeLo)
        : "";
    bins.push({
      label,
      count: counts[i],
      tone,
    });
  }
  return bins;
}

function buildStrategyDist(trades: Trade[]): DistBin[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    const s = t.strategy || "OTHER";
    map.set(s, (map.get(s) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count, tone: 0 as const }));
}

export type AccountPage =
  | { kind: "all"; label: string }
  | { kind: "one"; id: number; label: string };

export function accountPages(accounts: Account[]): AccountPage[] {
  const active = accounts.filter((a) => a.status === "active");
  const pages: AccountPage[] = [{ kind: "all", label: "All accounts" }];
  for (const a of active) {
    pages.push({ kind: "one", id: a.id, label: a.label });
  }
  return pages;
}

const CAPITAL_KEY = "ft_labs_reports_starting_capital";

export function loadStartingCapital(defaultCap = 50000): number {
  if (typeof window === "undefined") return defaultCap;
  try {
    const raw = localStorage.getItem(CAPITAL_KEY);
    if (raw == null) return defaultCap;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : defaultCap;
  } catch {
    return defaultCap;
  }
}

export function saveStartingCapital(n: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CAPITAL_KEY, String(n));
  } catch {
    /* ignore */
  }
}
