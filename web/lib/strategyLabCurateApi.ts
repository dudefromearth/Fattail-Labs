/** Client for /api/me/strategy-lab/curate/* — Curate sim runtime. */

import { getJSON, postJSON } from "@/lib/client";

export type CurateInstance = {
  id: string;
  strategy_id: string;
  bound_version: string;
  pack_config_hash: string;
  status: string;
  allocation_usd: number;
  cash_usd: number;
  realized_pnl_usd: number;
  envelope: Record<string, unknown>;
  runners: Array<Record<string, unknown>>;
  fill_model: string;
  last_tick_at: string | null;
  last_tick_status: string | null;
  last_error: string | null;
  /** ISO timestamp of last start/restart (arm). */
  run_started_at?: string | null;
  /** Wall-clock seconds since run_started_at (server snapshot). */
  runtime_seconds?: number | null;
  /** Adaptive label: 42s · 3:45 · 2h 15m · 3d 4h */
  runtime_label?: string | null;
  account_mode: string;
  broker: string;
  created_at: string;
  updated_at: string;
};

export type CuratePosition = {
  id: string;
  symbol: string;
  qty: number;
  side: string;
  entry_price: number;
  max_loss_usd: number;
  max_profit_usd: number;
  mark_price: number | null;
  unrealized_pnl_usd: number;
  status: string;
  close_reason: string | null;
  realized_pnl_usd: number | null;
  opened_at: string;
};

export type CurateDecision = {
  id: number;
  runner_type: string;
  event_type: string;
  reason_code: string | null;
  message: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export async function fetchCurateMeta(): Promise<{
  fill_model: string;
  fill_model_label: string;
  broker: string;
  deploy_for_members: boolean;
  symbol_universe?: string[];
} | null> {
  return getJSON("/api/me/strategy-lab/curate/meta");
}

export type CurateSymbolRow = {
  symbol: string;
  kind: string;
  kind_label: string;
  role: string;
  note: string | null;
  options_cadence: string | null;
  mid: number | null;
  prev_close: number | null;
  day_change_pct: number | null;
  stale: boolean | null;
  is_proxy: boolean;
  source: string | null;
  href: string;
  can_scan_open?: boolean;
};

export type CurateSymbolGroup = {
  kind: string;
  label: string;
  symbols: CurateSymbolRow[];
};

export type CurateSymbolCatalog = {
  groups: CurateSymbolGroup[];
  symbols: CurateSymbolRow[];
  count: number;
  tradeable_only: boolean;
};

export type CurateSymbolDetail = CurateSymbolRow & {
  feed_symbol: string | null;
  proxy_symbol: string | null;
  enabled: boolean;
  day_open: number | null;
  day_high: number | null;
  day_low: number | null;
  label: string | null;
  asof: string | null;
  age_seconds: number | null;
  can_scan_open: boolean;
  related: string[];
  info: { shared_stream: boolean; usage: string; honesty: string };
  vol_context?: Record<string, unknown> | null;
};

export async function fetchCurateSymbolCatalog(opts?: {
  tradeable_only?: boolean;
}): Promise<CurateSymbolCatalog | null> {
  const q = opts?.tradeable_only ? "?tradeable_only=true" : "";
  return getJSON(`/api/me/strategy-lab/curate/symbols${q}`);
}

export async function fetchCurateSymbolDetail(
  symbol: string,
): Promise<CurateSymbolDetail | null> {
  return getJSON(
    `/api/me/strategy-lab/curate/symbols/${encodeURIComponent(symbol)}`,
  );
}

export type CuratePositionReportRow = CuratePosition & {
  instance_id: string;
  instance_status: string;
  bound_version: string;
  instance_cash_usd: number;
  instance_realized_pnl_usd: number;
  bot_id?: string;
  bot_name?: string;
  strategy_id: string;
  strategy_name: string;
  strategy_phase: string;
  strategy_version: string;
  progress_frac: number;
  progress_to_tp_pct: number;
  account_mode: string;
  broker: string;
};

export type CuratePositionsReport = {
  asof: string;
  account_mode: string;
  broker: string;
  fill_model: string;
  note: string;
  summary: {
    positions_returned: number;
    open_count: number;
    closed_count: number;
    open_risk_usd: number;
    open_unrealized_pnl_usd: number;
    closed_realized_pnl_usd: number;
  };
  positions: CuratePositionReportRow[];
};

export async function fetchCuratePositionsReport(opts?: {
  status?: "all" | "open" | "closed";
  strategy_id?: string;
  limit?: number;
}): Promise<CuratePositionsReport | null> {
  const q = new URLSearchParams();
  if (opts?.status) q.set("status", opts.status);
  if (opts?.strategy_id) q.set("strategy_id", opts.strategy_id);
  if (opts?.limit) q.set("limit", String(opts.limit));
  const qs = q.toString();
  return getJSON(
    `/api/me/strategy-lab/curate/positions-report${qs ? `?${qs}` : ""}`,
  );
}

export type CurateComparisonRow = {
  instance_id: string;
  instance_status: string;
  bot_id?: string;
  bot_name?: string;
  strategy_id: string;
  strategy_name: string;
  strategy_attribute?: string;
  bound_version: string;
  scan_symbol?: string;
  allocation_usd: number;
  cash_usd: number;
  realized_pnl_usd: number;
  open_positions: number;
  closed_positions: number;
  open_risk_usd: number;
  open_unrealized_pnl_usd: number;
  closed_realized_pnl_usd: number;
  equity_approx_usd: number;
  vs_allocation_usd: number;
  take_profit_exits: number;
  stop_or_max_loss_exits: number;
  process_tp_share_of_closes: number | null;
  decision_log_events: number;
  equity_series?: { t?: string | null; equity: number; cash?: number | null }[];
  corr_vs_spy?: number | null;
  corr_vs_spy_n?: number | null;
  corr_interpretation?: string | null;
  last_tick_at: string | null;
  last_tick_status: string | null;
  run_started_at?: string | null;
  runtime_seconds?: number | null;
  runtime_label?: string | null;
};

export type CorrelationResult = {
  symbol_a: string;
  symbol_b: string;
  series_ticker_a?: string;
  series_ticker_b?: string;
  coefficient: number;
  method: string;
  days_requested: number;
  n_returns: number | null;
  date_start?: string | null;
  date_end?: string | null;
  interpretation?: string;
  note?: string;
  series_note_a?: string;
  series_note_b?: string;
};

export async function fetchSymbolCorrelation(
  a: string,
  b: string,
  days = 60,
): Promise<{ data?: CorrelationResult; error?: string }> {
  const q = new URLSearchParams({
    a,
    b,
    days: String(days),
  });
  try {
    const r = await fetch(
      `/api/me/strategy-lab/curate/correlation?${q.toString()}`,
      { credentials: "include" },
    );
    const j = (await r.json().catch(() => ({}))) as CorrelationResult & {
      detail?: string;
    };
    if (!r.ok) {
      return {
        error: typeof j.detail === "string" ? j.detail : "Correlation failed",
      };
    }
    return { data: j };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export type CurateComparisonReport = {
  asof: string;
  purpose: string;
  summary: {
    instances: number;
    armed_or_running: number;
    strategies: number;
    bots?: number;
  };
  /** Preferred key — bot runs */
  bots?: CurateComparisonRow[];
  /** Legacy alias of bots */
  strategies: CurateComparisonRow[];
};

export async function fetchCurateComparison(): Promise<CurateComparisonReport | null> {
  return getJSON("/api/me/strategy-lab/curate/comparison");
}

export async function tickAllCurateInstances(body?: {
  mark_step_frac?: number;
}): Promise<{
  ticked: number;
  ok: number;
  errors: number;
  results: Array<Record<string, unknown>>;
  error?: string;
}> {
  const r = await postJSON("/api/me/strategy-lab/curate/tick-all", body || {});
  const j = (await r.json().catch(() => ({}))) as {
    ticked?: number;
    ok?: number;
    errors?: number;
    results?: Array<Record<string, unknown>>;
    detail?: string;
  };
  if (!r.ok) {
    return {
      ticked: 0,
      ok: 0,
      errors: 0,
      results: [],
      error: typeof j.detail === "string" ? j.detail : "Tick-all failed",
    };
  }
  return {
    ticked: j.ticked ?? 0,
    ok: j.ok ?? 0,
    errors: j.errors ?? 0,
    results: j.results ?? [],
  };
}

export async function listCurateInstances(
  strategyId?: string,
): Promise<{ instances: CurateInstance[] } | null> {
  const q = strategyId
    ? `?strategy_id=${encodeURIComponent(strategyId)}`
    : "";
  return getJSON(`/api/me/strategy-lab/curate/instances${q}`);
}

export async function createCurateInstance(body: {
  strategy_id: string;
  envelope?: Record<string, unknown>;
}): Promise<{ instance?: CurateInstance; error?: string }> {
  const r = await postJSON("/api/me/strategy-lab/curate/instances", body);
  const j = (await r.json().catch(() => ({}))) as {
    instance?: CurateInstance;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Create failed" };
  }
  return { instance: j.instance };
}

export async function getCurateInstance(id: string): Promise<{
  instance: CurateInstance;
  positions: CuratePosition[];
  decisions: CurateDecision[];
} | null> {
  return getJSON(`/api/me/strategy-lab/curate/instances/${id}`);
}

export async function armCurateInstance(
  id: string,
): Promise<{ instance?: CurateInstance; error?: string }> {
  const r = await postJSON(
    `/api/me/strategy-lab/curate/instances/${id}/arm`,
    {},
  );
  const j = (await r.json().catch(() => ({}))) as {
    instance?: CurateInstance;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Arm failed" };
  }
  return { instance: j.instance };
}

export async function pauseCurateInstance(
  id: string,
): Promise<{ instance?: CurateInstance; error?: string }> {
  const r = await postJSON(
    `/api/me/strategy-lab/curate/instances/${id}/pause`,
    {},
  );
  const j = (await r.json().catch(() => ({}))) as {
    instance?: CurateInstance;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Pause failed" };
  }
  return { instance: j.instance };
}

export async function tickCurateInstance(
  id: string,
  body?: { force_pnl_frac?: number; mark_step_frac?: number },
): Promise<{
  instance?: CurateInstance;
  positions?: CuratePosition[];
  events?: Array<Record<string, unknown>>;
  error?: string;
}> {
  const r = await postJSON(
    `/api/me/strategy-lab/curate/instances/${id}/tick`,
    body || {},
  );
  const j = (await r.json().catch(() => ({}))) as {
    instance?: CurateInstance;
    positions?: CuratePosition[];
    events?: Array<Record<string, unknown>>;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Tick failed" };
  }
  return j;
}
