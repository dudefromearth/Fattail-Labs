/** Client for /api/me/capital/* — Accounts & Capital stack. */

export type CapitalAccountBalance = {
  id: number;
  label: string;
  broker?: string | null;
  status: string;
  starting_balance: number | null;
  starting_balance_set: boolean;
  fill_pnl_sum: number;
  movements_sum: number;
  current_balance: number;
  account_value?: number;
  account_value_kind?: string;
  buying_power_posture?: string;
  buying_power_value?: number | null;
  buying_power_as_of?: string | null;
};

export type PositionValuationRow = {
  trade_id: number;
  account_id: number;
  symbol: string;
  underlier?: string | null;
  asset_class: string;
  strategy?: string | null;
  qty: number;
  avg_cost: number | null;
  cost_basis: number | null;
  last: number | null;
  day: number | null;
  day_gl: number | null;
  value: number | null;
  value_label: string;
  unrealized: number | null;
  pct_acct?: number | null;
  campaign: { campaign_id: number; title: string; stamped_by?: string | null } | null;
  degraded: boolean;
};

export type PositionsValuation = {
  marks_as_of: string | null;
  marks_age_seconds: number | null;
  valuation_uses_latest_mark: boolean;
  /** A6 — stream process heartbeat beyond ops threshold */
  stream_heartbeat_stale?: boolean;
  stream_heartbeat?: {
    status?: string;
    last_ok_at?: string | null;
    last_ok_age_seconds?: number | null;
    last_error?: string | null;
  } | null;
  degraded_symbols: string[];
  campaigns: { id: number; title: string }[];
  accounts: {
    account_id: number;
    label: string;
    broker?: string | null;
    buying_power: {
      posture: string;
      value: number | null;
      as_of: string | null;
    };
    cash: number | null;
    cash_omitted_reason?: string | null;
    positions: PositionValuationRow[];
    totals: {
      value: number;
      day_gl: number;
      unrealized: number;
      n: number;
      definition: string;
    };
  }[];
  grand_total: {
    value: number;
    day_gl: number;
    unrealized: number;
    n: number;
    definition: string;
  };
};

export type CapitalPrefs = {
  tolerated_master_drawdown: number | null;
  tolerated_master_drawdown_form: "percent" | "dollars" | string;
  buying_power_posture: "arbitrary" | "self_report" | "live_sync" | string;
  buying_power_value: number | null;
  buying_power_as_of: string | null;
  balances_confirmed_at: string | null;
  export_key?: string | null;
};

export type MasterDrawdown = {
  realized_dd_dollars: number;
  tolerance_budget_dollars: number | null;
  over_budget: boolean;
  sample_n: number;
};

export type CapitalOverview = {
  accounts: CapitalAccountBalance[];
  total_net_capital: number;
  prefs: CapitalPrefs;
  master_drawdown: MasterDrawdown;
  witnesses: { master_dd: string | null };
};

export type CashMovement = {
  id: number;
  account_id: number;
  amount: number;
  occurred_at: string | null;
  recorded_at: string | null;
  note: string;
  reverses_movement_id: number | null;
};

async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(path, { credentials: "same-origin" });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || `${r.status}`);
  }
  return r.json() as Promise<T>;
}

async function sendJSON<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const r = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || `${r.status}`);
  }
  return r.json() as Promise<T>;
}

export function fetchCapitalOverview(): Promise<CapitalOverview> {
  return getJSON("/api/me/capital/overview");
}

export function patchCapitalPrefs(
  body: Partial<CapitalPrefs> & { confirm_balances?: boolean },
): Promise<{ prefs: CapitalPrefs }> {
  return sendJSON("/api/me/capital/prefs", "PATCH", body);
}

export function fetchMovements(
  accountId: number,
): Promise<{ movements: CashMovement[]; account_id: number }> {
  return getJSON(`/api/me/capital/accounts/${accountId}/movements`);
}

export function addMovement(
  accountId: number,
  body: {
    amount: number;
    occurred_at?: string | null;
    note?: string | null;
    reverses_movement_id?: number | null;
  },
): Promise<{ movement: CashMovement; overview: CapitalOverview }> {
  return sendJSON(
    `/api/me/capital/accounts/${accountId}/movements`,
    "POST",
    body,
  );
}

export function fetchPositionsValuation(opts?: {
  accountId?: number | null;
  campaignId?: number | null;
  undirected?: boolean | null;
  assetClass?: string | null;
}): Promise<PositionsValuation> {
  const q = new URLSearchParams();
  if (opts?.accountId != null && opts.accountId > 0) {
    q.set("account_id", String(opts.accountId));
  }
  if (opts?.campaignId != null && opts.campaignId > 0) {
    q.set("campaign_id", String(opts.campaignId));
  }
  if (opts?.undirected === true) q.set("undirected", "true");
  if (opts?.undirected === false) q.set("undirected", "false");
  if (opts?.assetClass) q.set("asset_class", opts.assetClass);
  const qs = q.toString();
  return getJSON(`/api/me/capital/positions-valuation${qs ? `?${qs}` : ""}`);
}

export function patchAccountBuyingPower(
  accountId: number,
  body: {
    buying_power_posture?: string;
    buying_power_value?: number | null;
  },
): Promise<{ account: CapitalAccountBalance }> {
  return sendJSON(
    `/api/me/capital/accounts/${accountId}/buying-power`,
    "PATCH",
    body,
  );
}

/** Header as-of: true age (weekend rule) — never invent currency. */
export type MarketUniverseSymbol = {
  symbol: string;
  kind?: string;
  role?: string;
  enabled?: boolean;
  note?: string | null;
  options_cadence?: string | null;
  feed_symbol?: string | null;
  proxy_symbol?: string | null;
  mid?: number | null;
  prev_close?: number | null;
  day_change_pct?: number | null;
  mark_asof?: string | null;
};

export function fetchMarketUniverse(opts?: {
  enabledOnly?: boolean;
}): Promise<{
  symbols: MarketUniverseSymbol[];
  count: number;
  source: string;
}> {
  const q =
    opts?.enabledOnly === false ? "?enabled_only=false" : "?enabled_only=true";
  return getJSON(`/api/me/market/universe${q}`);
}

/** Age (seconds) above which Positions header flags marks as stale (A6). */
export const MARKS_STALE_UI_SECONDS = 5 * 60;

export function marksAgeIsStale(
  ageSeconds: number | null | undefined,
  threshold = MARKS_STALE_UI_SECONDS,
): boolean {
  return ageSeconds != null && Number.isFinite(ageSeconds) && ageSeconds > threshold;
}

function formatAgeSeconds(age: number): string {
  const h = Math.floor(age / 3600);
  if (h >= 24) return `~${Math.floor(h / 24)}d ago`;
  if (h >= 1) return `~${h}h ago`;
  const m = Math.floor(age / 60);
  if (m >= 1) return `~${m}m ago`;
  return `~${Math.floor(age)}s ago`;
}

/**
 * Header as-of with age honesty (A6). Never invent a live mid when age is huge —
 * surface wall-clock as-of + relative age + Stale when over threshold.
 */
export function formatMarksAsOf(v: PositionsValuation | null | undefined): string {
  if (!v) return "Marks unavailable";
  const age = v.marks_age_seconds;
  const stale = marksAgeIsStale(age);
  const streamDead = !!v.stream_heartbeat_stale;
  let base = "";
  if (v.marks_as_of) {
    try {
      const d = new Date(v.marks_as_of);
      if (!Number.isNaN(d.getTime())) {
        base = `Marks as of ${d.toLocaleString(undefined, {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        })}`;
      }
    } catch {
      /* fall through */
    }
    if (!base) base = `Marks as of ${v.marks_as_of}`;
  } else if (age != null) {
    base = `Marks as of ${formatAgeSeconds(age)}`;
  } else {
    base = "Marks as of —";
  }
  if (age != null && v.marks_as_of) {
    base = `${base} (${formatAgeSeconds(age)})`;
  }
  if (streamDead) {
    base = `${base} · Stream stale — check live marks process`;
  } else if (stale) {
    base = `${base} · Stale — not a live last`;
  }
  return base;
}
