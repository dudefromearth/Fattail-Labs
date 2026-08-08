/**
 * Shared Trade Log HTTP client (PH2-2).
 * Analytics + blotter paths; domain math stays on the server.
 */

import type { Account, Catalog, Trade } from "@/lib/tradeLog";

export type {
  ServerDayBook,
  ServerDayBookItem,
  ServerReportsBook,
  ServerSeriesPoint,
  AnalyticsFetchError,
  AnalyticsResult,
} from "@/lib/tradeLogAnalytics";

export {
  fetchAccounts,
  fetchDayBook,
  fetchDaysInterest,
  fetchReportsBook,
} from "@/lib/tradeLogAnalytics";

import type { AnalyticsResult } from "@/lib/tradeLogAnalytics";

async function parseJson<T>(r: Response): Promise<AnalyticsResult<T>> {
  if (r.status === 401) return { ok: false, error: { kind: "anon" } };
  if (r.status === 403) return { ok: false, error: { kind: "forbidden" } };
  if (!r.ok) {
    const message = await r.text().catch(() => r.statusText);
    return { ok: false, error: { kind: "err", message } };
  }
  return { ok: true, data: (await r.json()) as T };
}

export type TradesPage = {
  trades: Trade[];
  accounts: Account[];
  default_account_id?: number;
  has_more?: boolean;
  next_cursor?: string | null;
  page_limit?: number | null;
};

/** Phase 2 trade chart — underlier OHLC for hold window. */
export type TradeChartBar = {
  t: number;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number;
  v: number | null;
};

export type TradeChartMarker = {
  kind: "entry" | "exit" | string;
  t: string;
  t_ms: number;
  label: string;
  trade_id?: number | null;
};

export type TradeChartPayload = {
  ok: boolean;
  status: string;
  error?: string | null;
  message?: string | null;
  trade_id?: number;
  tf: string;
  product_symbol?: string;
  series_ticker?: string;
  proxy_label?: string | null;
  source?: string;
  window?: { from: string; to: string };
  bars: TradeChartBar[];
  markers: TradeChartMarker[];
  structure_band?: { low: number; high: number } | null;
  cache?: { hit: boolean; ttl_s: number };
};

export async function fetchTradeChart(
  tradeId: number,
  tf: "5m" | "15m" | "1d" = "15m",
): Promise<AnalyticsResult<TradeChartPayload>> {
  const q = new URLSearchParams({ tf });
  const r = await fetch(
    `/api/me/trade-log/trades/${tradeId}/chart?${q.toString()}`,
    { credentials: "same-origin" },
  );
  return parseJson(r);
}

/** Paginated blotter list (default page size server-side ~80). */
export async function fetchTrades(
  accountId?: number | null,
  opts?: {
    limit?: number;
    cursor?: string | null;
    full?: boolean;
    practice_campaign_id?: number | null;
    playbook_entry_id?: number | null;
  },
): Promise<AnalyticsResult<TradesPage>> {
  const q = new URLSearchParams();
  if (accountId != null && accountId > 0) {
    q.set("account_id", String(accountId));
  }
  if (opts?.practice_campaign_id != null && opts.practice_campaign_id > 0) {
    q.set("practice_campaign_id", String(opts.practice_campaign_id));
  }
  if (opts?.playbook_entry_id != null && opts.playbook_entry_id > 0) {
    q.set("playbook_entry_id", String(opts.playbook_entry_id));
  }
  if (opts?.full) {
    q.set("full", "1");
  } else {
    if (opts?.limit != null) q.set("limit", String(opts.limit));
    if (opts?.cursor) q.set("cursor", opts.cursor);
  }
  const qs = q.toString();
  const r = await fetch(
    `/api/me/trade-log/trades${qs ? `?${qs}` : ""}`,
    { credentials: "same-origin" },
  );
  return parseJson(r);
}

/** Server-matched unmatched opens only (full book on server, small client payload). */
export async function fetchUnmatchedOpens(
  accountId?: number | null,
): Promise<AnalyticsResult<{ trades: Trade[]; accounts: Account[]; count: number }>> {
  const q =
    accountId != null && accountId > 0
      ? `?account_id=${accountId}`
      : "";
  const r = await fetch(`/api/me/trade-log/opens${q}`, {
    credentials: "same-origin",
  });
  return parseJson(r);
}

export async function fetchCatalog(): Promise<
  AnalyticsResult<{ venues: Catalog["venues"]; strategies: Catalog["strategies"] }>
> {
  const r = await fetch("/api/me/trade-log/venues", {
    credentials: "same-origin",
  });
  return parseJson(r);
}

export function exportUrl(opts: {
  accountId?: number | null;
  format?: string;
}): string {
  const q = new URLSearchParams();
  if (opts.accountId) q.set("account_id", String(opts.accountId));
  if (opts.format) q.set("format", opts.format);
  return `/api/me/trade-log/export?${q.toString()}`;
}
