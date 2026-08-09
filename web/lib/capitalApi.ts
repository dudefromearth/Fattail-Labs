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
