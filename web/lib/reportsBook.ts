/**
 * Reports presentation — formats server analytics/reports-book (PH1-3).
 * Domain math: server/trade_log_domain (not here).
 */

import type { Account } from "@/lib/tradeLog";
import type { ServerReportsBook } from "@/lib/tradeLogAnalytics";

export type SeriesPoint = {
  t: string;
  equity: number;
  drawdownPct: number;
  peak: number;
  tradeIndex: number;
  tradeId?: number;
};

export type StatRow = {
  key: string;
  label: string;
  value: string;
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
  /** Total return % of starting capital — path aggregate, not a ratio magnifier. */
  totalReturnPct: number;
  /** Gross wins / gross losses; null = unbounded (∞). */
  profitFactor: number | null;
  winRatePct: number;
  /** Entry R2R: potential ÷ risk at open (not outcome-based). */
  avgEntryR2r: number | null;
  entryR2rSampleSize: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  winners: number;
  losers: number;
  sharpe: number;
  sharpeSampleSize: number;
};

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

/** Match Coach spreadsheet histogram density (0DTE trade log). */
const OUTCOME_BIN_COUNT = 125;

/**
 * Equal-width $ histogram (presentation only).
 * Winsorized at 1st/99th percentile for bin edges.
 */
export function buildPnlDistribution(pnls: number[]): DistBin[] {
  if (pnls.length === 0) {
    return Array.from({ length: OUTCOME_BIN_COUNT }, (_, i) => ({
      label: String(i),
      count: 0,
      tone: 0 as const,
    }));
  }

  const sorted = [...pnls].sort((a, b) => a - b);
  const atPct = (p: number) => {
    const i = Math.min(
      sorted.length - 1,
      Math.max(0, Math.floor((p / 100) * sorted.length)),
    );
    return sorted[i];
  };
  let lo = atPct(1);
  let hi = atPct(99);
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
    const label =
      i === 0 || i === n - 1 || i % 10 === 0 ? fmt(edgeLo) : "";
    bins.push({ label, count: counts[i], tone });
  }
  return bins;
}

function buildStrategyDistFromCounts(
  counts: Record<string, number>,
): DistBin[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count, tone: 0 as const }));
}

/** Map server reports-book DTO → UI ReportsBook (labels, histogram). */
export function reportsBookFromServer(raw: ServerReportsBook): ReportsBook {
  const s = raw.stats;
  const hasPnlData = raw.has_pnl_data;
  const pnls = raw.outcome_pnls || [];
  const winners = raw.winners;
  const losers = raw.losers;
  const decided = winners + losers;
  const avgWin = raw.avg_win;
  const avgLoss = raw.avg_loss;
  const avgNet = pnls.length > 0 ? s.net_profit / pnls.length : 0;
  const avgRisk = losers > 0 ? avgLoss : pnls.length > 0 ? Math.abs(avgNet) : 0;
  // Entry-time R2R from server (potential ÷ risk at open). Never avg-win/avg-loss.
  const avgEntryR2r =
    raw.avg_entry_r2r != null && Number.isFinite(raw.avg_entry_r2r)
      ? raw.avg_entry_r2r
      : s.avg_entry_r2r != null && Number.isFinite(s.avg_entry_r2r)
        ? s.avg_entry_r2r
        : null;
  const entryR2rSampleSize =
    raw.entry_r2r_sample_size ?? s.entry_r2r_sample_size ?? 0;
  const ratioWinLoss =
    raw.win_loss_ratio == null
      ? avgWin > 0
        ? Infinity
        : 0
      : raw.win_loss_ratio;
  const profitFactor = s.profit_factor;
  const largestWin = s.largest_win;
  const largestLoss = s.largest_loss;
  const grossProfit = s.gross_profit;
  const grossLoss = s.gross_loss;
  const winnerAsGross =
    grossProfit > 0 && largestWin > 0 ? (largestWin / grossProfit) * 100 : 0;
  const loserAsGross =
    grossLoss > 0 && largestLoss < 0
      ? (Math.abs(largestLoss) / grossLoss) * 100
      : 0;
  const maxDdPct = raw.max_drawdown_pct;
  const sharpe = raw.sharpe;

  const stats: StatRow[] = [
    {
      key: "span",
      label: "Span in Days",
      value: String(s.span_days),
      tone: "plain",
    },
    {
      key: "capital",
      label: "Starting Capital",
      value: money(raw.starting_capital),
      tone: "capital",
    },
    {
      key: "balance",
      label: "Balance",
      value: money(raw.end_balance),
      tone: "balance",
    },
    {
      key: "return",
      label: "Total Return",
      // Aggregate path result (like Balance/Net) — not a ratio; do not tone as "key"
      value: hasPnlData ? pct(s.total_return_pct) : "—",
      tone: "balance",
    },
    {
      key: "gprofit",
      label: "Gross wins (sum)",
      value: hasPnlData ? money(grossProfit) : "—",
      tone: "plain",
    },
    {
      key: "gloss",
      label: "Gross losses (sum)",
      value: hasPnlData ? money(-grossLoss, true) : "—",
      tone: "loss",
    },
    {
      key: "net",
      label: "Net outcome",
      value: hasPnlData ? money(s.net_profit) : "—",
      tone: "plain",
    },
    {
      key: "pf",
      label: "Profit Factor",
      value: hasPnlData
        ? profitFactor == null
          ? "∞"
          : profitFactor.toFixed(2)
        : "—",
      tone: "key",
    },
    {
      key: "trades",
      label: "Total Trade",
      value: String(raw.trade_count),
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
      value: decided > 0 ? pct(s.win_rate, 1) : "—",
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
      label: "Risk to Reward",
      value:
        avgEntryR2r != null && avgEntryR2r > 0
          ? avgEntryR2r.toFixed(2)
          : "—",
      tone: "key",
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
      value: String(raw.open_count),
      tone: "plain",
    },
  ];

  const series: SeriesPoint[] = (raw.series || []).map((p) => ({
    t: p.t,
    equity: p.equity,
    drawdownPct: p.drawdown_pct,
    peak: p.peak,
    tradeIndex: p.trade_index,
    tradeId: p.trade_id,
  }));

  return {
    accountLabel: raw.account_label,
    startingCapital: raw.starting_capital,
    series,
    stats,
    distribution: buildPnlDistribution(pnls),
    strategyDist: buildStrategyDistFromCounts(raw.strategy_counts || {}),
    tradeCount: raw.trade_count,
    hasPnlData,
    endBalance: raw.end_balance,
    maxDrawdownPct: maxDdPct,
    totalReturnPct: s.total_return_pct,
    profitFactor,
    winRatePct: s.win_rate,
    avgEntryR2r,
    entryR2rSampleSize,
    avgWin,
    avgLoss,
    winLossRatio:
      ratioWinLoss === Infinity ? 99 : Number.isFinite(ratioWinLoss) ? ratioWinLoss : 0,
    winners,
    losers,
    sharpe,
    sharpeSampleSize: raw.sharpe_sample_size,
  };
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
