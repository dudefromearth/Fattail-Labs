/** Quant Lab read API — ATRV primitives over the [C][T] store.
 *
 * Same-origin /api/me/quant/* (Next rewrites → FastAPI). The server says which
 * response fields are display_legal; this client does not widen that.
 */

export type QuantDay = { day: string; book: string; T: number; C: number; greeks_quantum_decimals?: number };

export type MarkResponse = {
  day: string; book: string; t0: number; t1: number;
  time_ms: number[]; spot: (number | null)[]; mark: (number | null)[];
  leg_present: boolean[]; withheld: number; units: string; note: string;
  legs: { strike: number; side: string; qty: number }[];
};

export type Bands = Record<"p01" | "p05" | "p10" | "p25" | "p50" | "p75" | "p90" | "p95" | "p99", number>;

export type SimulateResponse = {
  n: number; n_traded: number; seed: number; strategy_id: string;
  t_entry: number; t_exit: number; t_exit_resolved: number; t_entry_acted: number; t_exit_acted: number;
  exit: { kind: "time" } | { kind: "target"; pct: number; hit: boolean; mark_at_hit?: number; debit_mid: number };
  time_entry_ms: number; time_exit_ms: number;
  ecdf: { x: number[]; F: number[] };
  bands: Bands;
  modality: { n_modes: number | null; modes: number[]; valleys: number[]; note?: string };
  no_fill_rate: { entry: number; exit: number | null };
  tax: { friction_bands: Bands; fees_bands: Bands; probability: number; per_side: string };
  stability: { n_half_vs_n: number | null; enough?: boolean; note?: string };
  fidelity: string;
  assumptions: Record<string, unknown> & { label?: string };
  display_legal: string[];
  provenance: { store?: string; built_at?: string; greeks_quantum_decimals?: number };
  legs: { strike: number; side: string; qty: number }[];
};

export type QuantRefusal = { refusal: string; detail: string };

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path, { credentials: "same-origin", cache: "no-store" });
  if (r.status === 501) throw new Error("QUANT STORE NOT CONFIGURED");
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `API ${r.status}`);
  }
  return r.json() as Promise<T>;
}

export function fetchQuantDays(): Promise<{ days: QuantDay[] }> {
  return get("/api/me/quant/days");
}

export function fetchSpot(day: string, book: string): Promise<{ T: number; time_ms: number[]; spot: (number | null)[]; strikes: number[] }> {
  const q = new URLSearchParams({ day, book });
  return get(`/api/me/quant/spot?${q}`);
}

export function fetchMark(day: string, book: string, legs: string): Promise<MarkResponse> {
  const q = new URLSearchParams({ day, book, legs });
  return get(`/api/me/quant/mark?${q}`);
}

export type ExitSpec = { exit_kind: "time" } | { exit_kind: "target"; target_pct: number };

export async function runSimulate(body: {
  day: string; book: string; legs: string; t_entry: number; t_exit: number;
  paths: number; seed: number; latency_snapshots?: number;
} & ExitSpec): Promise<SimulateResponse> {
  const r = await fetch("/api/me/quant/simulate", {
    method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (r.status === 501) throw new Error("QUANT STORE NOT CONFIGURED");
  if (r.status === 409) {
    const b = await r.json();
    const d = b.detail as QuantRefusal;
    throw new Error(`${d.refusal}: ${d.detail}`);
  }
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `API ${r.status}`);
  }
  return r.json();
}

export function hhmm(ms: number, tz = "America/New_York"): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: tz });
}

export type SweepResponse = Omit<SimulateResponse, "n" | "n_traded" | "t_entry" | "t_exit" | "t_entry_acted" | "t_exit_acted" | "time_entry_ms" | "tax" | "provenance"> & {
  entries: number; refused_entries: number; paths_per_entry: number; n_pooled: number;
  t_exit: number; time_exit_ms: number; window: { t_from: number; t_to: number; step: number };
  per_entry: ({ t_entry: number; time_ms: number; n_traded: number; bands: Bands; exit?: SimulateResponse["exit"]; t_exit_resolved?: number } | { t_entry: number; refused: true })[];
  exit_rule: { kind: string; pct: number };
  target: { entries_hit: number; of: number; minutes_in_bands: Bands | null } | null;
};

export async function runSweep(body: {
  day: string; book: string; legs: string; t_from: number; t_to: number; t_exit: number;
  step: number; paths_per_entry: number; seed: number; latency_snapshots?: number;
} & ExitSpec): Promise<SweepResponse> {
  const r = await fetch("/api/me/quant/sweep", {
    method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (r.status === 501) throw new Error("QUANT STORE NOT CONFIGURED");
  if (r.status === 409) { const b = await r.json(); const d = b.detail as QuantRefusal; throw new Error(`${d.refusal}: ${d.detail}`); }
  if (!r.ok) { const body = await r.json().catch(() => ({})); throw new Error(typeof body.detail === "string" ? body.detail : `API ${r.status}`); }
  return r.json();
}
