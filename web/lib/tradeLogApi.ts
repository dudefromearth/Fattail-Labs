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

export async function fetchTrades(accountId?: number | null): Promise<
  AnalyticsResult<{
    trades: Trade[];
    accounts: Account[];
    default_account_id?: number;
  }>
> {
  const q =
    accountId != null && accountId > 0
      ? `?account_id=${accountId}`
      : "";
  const r = await fetch(`/api/me/trade-log/trades${q}`, {
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
