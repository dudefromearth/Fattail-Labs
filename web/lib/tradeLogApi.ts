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
    const raw = await r.text().catch(() => r.statusText);
    let message = raw;
    try {
      const j = JSON.parse(raw) as { detail?: unknown };
      if (typeof j.detail === "string") message = j.detail;
    } catch {
      /* keep raw */
    }
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
  match_count?: number;
  book_count?: number;
};

/** Phase 2 process report pack — adherence + campaigns (no P&L). */
export type ProcessPackAdherence = {
  counts: {
    followed: number;
    partial: number;
    broke: number;
    unknown: number;
  };
  trade_count: number;
  decided_count: number;
  adherence_rate: number | null;
  adherence_rate_with_partial_credit?: number | null;
  labels?: Record<string, string>;
};

export type ProcessPackCampaign = {
  campaign_id: number;
  title: string;
  status?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  trade_count: number;
  by_adherence: Record<string, number>;
  adherence_rate: number | null;
  decided_count: number;
};

export type ProcessPackPayload = {
  from: string | null;
  to: string | null;
  account_id?: number | null;
  trade_count: number;
  adherence: ProcessPackAdherence;
  adherence_rate_series: Array<{
    t: string;
    v: number | null;
    followed: number;
    partial: number;
    broke: number;
    unknown: number;
    decided: number;
    trade_count: number;
  }>;
  campaigns: ProcessPackCampaign[];
  has_campaigns: boolean;
  process_only: boolean;
};

export async function fetchProcessPack(opts?: {
  accountId?: number | null;
  fromDay?: string | null;
  toDay?: string | null;
  seriesBucket?: "day" | "week";
}): Promise<AnalyticsResult<ProcessPackPayload>> {
  const q = new URLSearchParams();
  if (opts?.accountId != null && opts.accountId > 0) {
    q.set("account_id", String(opts.accountId));
  }
  if (opts?.fromDay) q.set("from_day", opts.fromDay);
  if (opts?.toDay) q.set("to_day", opts.toDay);
  if (opts?.seriesBucket) q.set("series_bucket", opts.seriesBucket);
  const qs = q.toString();
  const r = await fetch(
    `/api/me/trade-log/analytics/process-pack${qs ? `?${qs}` : ""}`,
    { credentials: "same-origin" },
  );
  return parseJson(r);
}

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

export type TradeLogSpan = {
  first_day: string | null;
  last_day: string | null;
  trade_count: number;
};

export type FoundSetItem = {
  id: number;
  practice_campaign_id: number | null;
  exec_at?: string | null;
};

export type FoundSet = {
  first_day: string | null;
  last_day: string | null;
  position_count: number;
  fill_count?: number;
  items?: FoundSetItem[];
};

export type TradeDistincts = {
  days?: string[];
  months: string[];
  strategies: string[];
  sides: string[];
  effects: string[];
  symbols: string[];
  campaigns: { id: number | null; title: string }[];
};

export async function fetchFoundSet(opts?: {
  strategies?: string | null;
  sides?: string | null;
  effects?: string | null;
  symbols?: string | null;
  years?: string | null;
  months?: string | null;
  days?: string | null;
  campaigns?: string | null;
}): Promise<AnalyticsResult<FoundSet>> {
  const q = new URLSearchParams();
  if (opts?.strategies) q.set("strategies", opts.strategies);
  if (opts?.sides) q.set("sides", opts.sides);
  if (opts?.effects) q.set("effects", opts.effects);
  if (opts?.symbols) q.set("symbols", opts.symbols);
  if (opts?.years) q.set("years", opts.years);
  if (opts?.months) q.set("months", opts.months);
  if (opts?.days) q.set("days", opts.days);
  if (opts?.campaigns) q.set("campaigns", opts.campaigns);
  const qs = q.toString();
  const r = await fetch(
    `/api/me/trade-log/found${qs ? `?${qs}` : ""}`,
    { credentials: "same-origin", cache: "no-store" },
  );
  return parseJson(r);
}

export async function fetchTradeDistincts(): Promise<
  AnalyticsResult<TradeDistincts>
> {
  const r = await fetch("/api/me/trade-log/distincts", {
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseJson(r);
}

export async function fetchTradeLogSpan(
  accountId?: number | null,
): Promise<AnalyticsResult<TradeLogSpan>> {
  const q = new URLSearchParams();
  if (accountId != null && accountId > 0) {
    q.set("account_id", String(accountId));
  }
  const qs = q.toString();
  const r = await fetch(
    `/api/me/trade-log/span${qs ? `?${qs}` : ""}`,
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
    /** Named default: no playbook link (not All). */
    playbook_mode?: "unaffiliated" | null;
    /** Journey F2: meter complement (broke + unknown). */
    adherence_mode?: "drift" | null;
    from_day?: string | null;
    to_day?: string | null;
    /** No campaign stamp — one campaign or none. */
    campaign_mode?: "unallocated" | null;
    /** Symbol / underlier / strategy. */
    q?: string | null;
    strategy?: string | null;
    net_side?: "CREDIT" | "DEBIT" | null;
    pos_effect?: "TO_OPEN" | "TO_CLOSE" | null;
    symbol?: string | null;
    strategies?: string | null;
    sides?: string | null;
    effects?: string | null;
    symbols?: string | null;
    years?: string | null;
    months?: string | null;
    days?: string | null;
    campaigns?: string | null;
    statuses?: string | null;
    /** Typed positions only (single / vertical / butterfly / …). */
    positions_only?: boolean;
  },
): Promise<AnalyticsResult<TradesPage>> {
  const q = new URLSearchParams();
  if (accountId != null && accountId > 0) {
    q.set("account_id", String(accountId));
  }
  if (opts?.campaign_mode === "unallocated") {
    q.set("campaign_mode", "unallocated");
  } else if (opts?.practice_campaign_id != null && opts.practice_campaign_id > 0) {
    q.set("practice_campaign_id", String(opts.practice_campaign_id));
  }
  if (opts?.playbook_mode === "unaffiliated") {
    q.set("playbook_mode", "unaffiliated");
  } else if (opts?.playbook_entry_id != null && opts.playbook_entry_id > 0) {
    q.set("playbook_entry_id", String(opts.playbook_entry_id));
  }
  if (opts?.adherence_mode === "drift") {
    q.set("adherence_mode", "drift");
  }
  if (opts?.from_day) q.set("from_day", opts.from_day);
  if (opts?.to_day) q.set("to_day", opts.to_day);
  if (opts?.q && opts.q.trim()) q.set("q", opts.q.trim());
  if (opts?.strategy) q.set("strategy", opts.strategy);
  if (opts?.net_side) q.set("net_side", opts.net_side);
  if (opts?.pos_effect) q.set("pos_effect", opts.pos_effect);
  if (opts?.symbol && opts.symbol.trim()) q.set("symbol", opts.symbol.trim());
  if (opts?.strategies) q.set("strategies", opts.strategies);
  if (opts?.sides) q.set("sides", opts.sides);
  if (opts?.effects) q.set("effects", opts.effects);
  if (opts?.symbols) q.set("symbols", opts.symbols);
  if (opts?.years) q.set("years", opts.years);
  if (opts?.months) q.set("months", opts.months);
  if (opts?.days) q.set("days", opts.days);
  if (opts?.campaigns) q.set("campaigns", opts.campaigns);
  if (opts?.statuses) q.set("statuses", opts.statuses);
  if (opts?.positions_only) q.set("positions_only", "true");
  if (opts?.full) {
    q.set("full", "1");
  } else {
    if (opts?.limit != null) q.set("limit", String(opts.limit));
    if (opts?.cursor) q.set("cursor", opts.cursor);
  }
  const qs = q.toString();
  const r = await fetch(
    `/api/me/trade-log/trades${qs ? `?${qs}` : ""}`,
    { credentials: "same-origin", cache: "no-store" },
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

export type BlotterDistincts = {
  days: string[];
  strategies: string[];
  symbols: string[];
  campaigns: string[];
  statuses: string[];
};

function blotterTokenList(xs: unknown): string[] {
  if (!Array.isArray(xs)) return [];
  const out: string[] = [];
  for (const x of xs) {
    if (typeof x === "string") {
      if (x) out.push(x);
    } else if (typeof x === "number" && Number.isFinite(x)) {
      out.push(String(x));
    } else if (x && typeof x === "object" && "id" in x) {
      const id = (x as { id: unknown }).id;
      out.push(id == null ? "none" : String(id));
    }
  }
  return out;
}

export async function fetchBlotterDistincts(
  accountId?: number | null,
): Promise<AnalyticsResult<BlotterDistincts>> {
  const q = new URLSearchParams();
  q.set("blotter", "1");
  if (accountId != null && accountId > 0) {
    q.set("account_id", String(accountId));
  }
  const r = await fetch(`/api/me/trade-log/distincts?${q}`, {
    credentials: "same-origin",
  });
  const parsed = await parseJson<BlotterDistincts>(r);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    data: {
      days: blotterTokenList(parsed.data.days),
      strategies: blotterTokenList(parsed.data.strategies),
      symbols: blotterTokenList(parsed.data.symbols),
      campaigns: blotterTokenList(parsed.data.campaigns),
      statuses: blotterTokenList(parsed.data.statuses),
    },
  };
}

export async function fetchCatalog(): Promise<
  AnalyticsResult<{ venues: Catalog["venues"]; strategies: Catalog["strategies"] }>
> {
  const r = await fetch("/api/me/trade-log/venues", {
    credentials: "same-origin",
  });
  return parseJson(r);
}

export async function createTrade(
  body: Record<string, unknown>,
): Promise<AnalyticsResult<Trade>> {
  const r = await fetch("/api/me/trade-log/trades", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function patchTradeCampaign(
  tradeId: number,
  practiceCampaignId: number | null,
): Promise<AnalyticsResult<Trade>> {
  const r = await fetch(`/api/me/trade-log/trades/${tradeId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ practice_campaign_id: practiceCampaignId }),
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
