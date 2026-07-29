/**
 * Practice analytics client — server read models (PH1-2 / PH1-3).
 * Domain math lives in server/trade_log_domain; this is fetch + typing only.
 */

import type { Account, Trade } from "@/lib/tradeLog";

export type ServerSeriesPoint = {
  t: string;
  equity: number;
  drawdown_pct: number;
  peak: number;
  trade_index: number;
  trade_id?: number;
};

export type ServerReportsBook = {
  account_label: string;
  starting_capital: number;
  series: ServerSeriesPoint[];
  trade_count: number;
  has_pnl_data: boolean;
  end_balance: number;
  max_drawdown_pct: number;
  open_count: number;
  winners: number;
  losers: number;
  avg_win: number;
  avg_loss: number;
  win_loss_ratio: number | null;
  sharpe: number;
  sharpe_sample_size: number;
  stats: {
    span_days: number;
    gross_profit: number;
    gross_loss: number;
    net_profit: number;
    total_return_pct: number;
    win_rate: number;
    profit_factor: number | null;
    largest_win: number;
    largest_loss: number;
  };
  outcome_pnls: number[];
  strategy_counts: Record<string, number>;
};

export type ServerDayBookItem = {
  trade: Trade;
  trade_id: number;
  role: "open" | "fill_open" | "fill_close";
  opened_on: string;
  closed_on: string | null;
  expires_on: string | null;
};

export type ServerDayBook = {
  day: string;
  activity: ServerDayBookItem[];
  open: ServerDayBookItem[];
  items: ServerDayBookItem[];
  open_ids: number[];
};

export type AnalyticsFetchError =
  | { kind: "anon" }
  | { kind: "forbidden" }
  | { kind: "err"; message: string };

export type AnalyticsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AnalyticsFetchError };

async function parseJson<T>(r: Response): Promise<AnalyticsResult<T>> {
  if (r.status === 401) return { ok: false, error: { kind: "anon" } };
  if (r.status === 403) return { ok: false, error: { kind: "forbidden" } };
  if (!r.ok) {
    const message = await r.text().catch(() => r.statusText);
    return { ok: false, error: { kind: "err", message } };
  }
  return { ok: true, data: (await r.json()) as T };
}

export async function fetchAccounts(): Promise<
  AnalyticsResult<{ accounts: Account[] }>
> {
  const r = await fetch("/api/me/trade-log/accounts", {
    credentials: "same-origin",
  });
  return parseJson(r);
}

export async function fetchReportsBook(opts: {
  accountId?: number | "all";
  startingCapital: number;
}): Promise<AnalyticsResult<ServerReportsBook>> {
  const params = new URLSearchParams();
  params.set("starting_capital", String(opts.startingCapital));
  if (opts.accountId != null && opts.accountId !== "all") {
    params.set("account_id", String(opts.accountId));
  }
  const r = await fetch(
    `/api/me/trade-log/analytics/reports-book?${params}`,
    { credentials: "same-origin" },
  );
  return parseJson(r);
}

export async function fetchDayBook(
  dayYmd: string,
  accountId?: number,
): Promise<AnalyticsResult<ServerDayBook>> {
  const params = new URLSearchParams({ day: dayYmd });
  if (accountId != null) params.set("account_id", String(accountId));
  const r = await fetch(
    `/api/me/trade-log/analytics/day-book?${params}`,
    { credentials: "same-origin" },
  );
  return parseJson(r);
}

export async function fetchDaysInterest(
  fromDay: string,
  toDay: string,
  accountId?: number,
): Promise<AnalyticsResult<{ days: string[] }>> {
  const params = new URLSearchParams({
    from_day: fromDay,
    to_day: toDay,
  });
  if (accountId != null) params.set("account_id", String(accountId));
  const r = await fetch(
    `/api/me/trade-log/analytics/days-interest?${params}`,
    { credentials: "same-origin" },
  );
  return parseJson(r);
}
