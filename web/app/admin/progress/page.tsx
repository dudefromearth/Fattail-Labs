"use client";

// Admin Progress — are we growing, and will we hit the target?
// Live from WooCommerce, YouTube and ActiveCampaign via /api/admin/progress.
// Read-only apart from the model parameters, which drive the projection.
// Spec: Specs/FatTail-Labs-Progress-Admin-Spec-v1.0.md · DL-530

import { useCallback, useEffect, useState } from "react";

type Param = {
  param_key: string; param_value: number; unit: string; label: string;
  hint: string; min_value: number; max_value: number; updated_by: string | null;
};
type Finding = {
  key: string; severity: string; title: string; detail: string;
  trigger: string; threshold: string;
};
type MonthRevenue = {
  month: string; by_tier: Record<string, number>; total: number;
  orders: number; partial: boolean; days_elapsed: number;
};
type ChurnRow = { month: string; lost: number; at_risk: number; rate: number | null; partial: boolean };
type FunnelRow = { month: string; signups: number; upgraded: number; rate: number | null; mature: boolean };
type ReachRow = {
  month: string; views: number; minutes_watched: number; partial: boolean;
  livestream?: number; long?: number; short?: number;
};
type CampaignRow = {
  month: string; campaigns: number; blasts: number; sent: number;
  open_rate: number | null; ctr: number | null; partial: boolean;
};
type Fresh = {
  last_success: string | null; age_minutes: number | null; stale: boolean;
  last_status: string; last_error: string | null;
};
type Report = {
  generated_at: string;
  target: number | null;
  params: Record<string, Param>;
  freshness: Record<string, Fresh>;
  findings: Finding[];
  commerce: {
    members: Record<string, { paying: number; payment_failed: number }>;
    prices: Record<string, number>;
    revenue: MonthRevenue[];
    churn: Record<string, ChurnRow[]>;
    funnel: FunnelRow[];
    observer_term_days: number | null;
    recurring_run_rate: number;
  } | null;
  reach: { channel: { title: string | null; subscribers: number } | null; monthly: ReachRow[] } | null;
  campaigns: CampaignRow[] | null;
  projection: {
    settles_at: number; observers_per_month: number;
    observers_needed: number | null; observers_needed_per_day: number | null;
    months_to_target: number | null;
    curve: { index: number; total: number }[];
  } | null;
};

const usd = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number | null | undefined, dp = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(dp)}%`;
const num = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

const SEVERITY: Record<string, string> = {
  critical: "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
  warning: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  good: "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
  info: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
};

function Tile({ label, value, sub, tone }: {
  label: string; value: string; sub?: string; tone?: "good" | "bad";
}) {
  const colour = tone === "bad" ? "text-rose-600 dark:text-rose-400"
    : tone === "good" ? "text-emerald-600 dark:text-emerald-400" : "";
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${colour}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function Panel({ title, hint, children }: {
  title: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-400 first:text-left">{children}</th>;
}
function Td({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return <td className={`px-3 py-2 text-right tabular-nums first:text-left ${dim ? "text-zinc-400" : ""}`}>{children}</td>;
}

export default function ProgressPage() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/progress", { credentials: "include" });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const refresh = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/progress/refresh", { method: "POST", credentials: "include" });
      await load();
    } finally { setBusy(false); }
  };

  const saveParam = async (key: string, value: number) => {
    await fetch(`/api/admin/progress/params/${key}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    await load();
  };

  if (error) {
    return <div className="p-6 text-sm text-rose-600">Progress unavailable: {error}</div>;
  }
  if (!data) return <div className="p-6 text-sm text-zinc-500">Loading…</div>;

  const c = data.commerce;
  const proj = data.projection;
  const latestRevenue = c?.revenue?.[c.revenue.length - 1];
  const paying = c ? Object.values(c.members).reduce((s, m) => s + m.paying, 0) : 0;
  const failed = c ? Object.values(c.members).reduce((s, m) => s + m.payment_failed, 0) : 0;
  const onTrack = proj && data.target != null ? proj.settles_at >= data.target : null;
  const tiers = ["Observer", "Activator", "Navigator", "Navigator Annual", "Navigator Lifetime"];

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Progress</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Live growth telemetry across WooCommerce, YouTube and ActiveCampaign.
            Every finding names the number that fired it. Stale sources are excluded
            rather than shown as zero.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={busy}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-600"
        >
          {busy ? "Pulling…" : "Refresh sources"}
        </button>
      </header>

      {/* Verdict */}
      {proj && (
        <div className={`rounded-lg border p-4 ${onTrack ? SEVERITY.good : SEVERITY.critical}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Against a {usd(data.target)} monthly target
          </div>
          <div className="mt-1 text-lg font-semibold">
            {onTrack
              ? `On track — the current funnel settles at ${usd(proj.settles_at)} a month.`
              : `Off track — the current funnel settles at ${usd(proj.settles_at)} a month.`}
          </div>
          {!onTrack && proj.observers_needed_per_day != null && (
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Reaching it needs about {num(proj.observers_needed)} Observers a month
              ({proj.observers_needed_per_day} a day) against{" "}
              {num(Math.round(proj.observers_per_month))} today.
            </div>
          )}
        </div>
      )}

      {/* Headline tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile label="Paying members" value={num(paying)} sub={`${failed} in payment failure`} />
        <Tile label="Recurring run-rate" value={usd(c?.recurring_run_rate)} sub="at list price" />
        <Tile
          label="This month"
          value={usd(latestRevenue?.total)}
          sub={latestRevenue?.partial ? `${latestRevenue.days_elapsed} days so far` : "complete"}
        />
        <Tile label="Observers / month" value={num(Math.round(proj?.observers_per_month ?? 0))} sub="last 3 complete months" />
        <Tile label="Observer term" value={c?.observer_term_days ? `${c.observer_term_days} days` : "—"} sub="currently sold" />
      </div>

      {/* Findings */}
      <div className="space-y-2">
        {data.findings.map((f) => (
          <div key={f.key} className={`rounded-lg border p-3 ${SEVERITY[f.severity] ?? SEVERITY.info}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{f.title}</span>
              <span className="font-mono text-xs text-zinc-500">
                {f.trigger} · vs {f.threshold}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{f.detail}</p>
          </div>
        ))}
        {!data.findings.length && (
          <div className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-400 dark:border-zinc-800">
            No findings yet — pull the sources to populate.
          </div>
        )}
      </div>

      {/* Revenue by tier */}
      {c && (
        <Panel title="Revenue by tier" hint="Every charge, initial and renewal alike, grouped by what was bought.">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60">
              <tr><Th>Month</Th>{tiers.map((t) => <Th key={t}>{t}</Th>)}<Th>Total</Th><Th>Orders</Th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {c.revenue.map((r) => (
                <tr key={r.month}>
                  <Td>{r.month}{r.partial && <span className="ml-1 text-xs text-zinc-400">({r.days_elapsed}d)</span>}</Td>
                  {tiers.map((t) => <Td key={t} dim={!r.by_tier[t]}>{r.by_tier[t] ? usd(r.by_tier[t]) : "—"}</Td>)}
                  <Td>{usd(r.total)}</Td>
                  <Td dim>{num(r.orders)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {/* Funnel + churn */}
      {c && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Observer funnel" hint="Intake vs upgrades on an identical 28-day window. Immature cohorts are marked.">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr><Th>Month</Th><Th>Signups</Th><Th>Upgraded</Th><Th>Rate</Th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {c.funnel.map((r) => (
                  <tr key={r.month}>
                    <Td>{r.month}{!r.mature && <span className="ml-1 text-xs text-amber-500">too young</span>}</Td>
                    <Td>{num(r.signups)}</Td><Td>{num(r.upgraded)}</Td>
                    <Td dim={!r.mature}>{pct(r.rate)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Cancellation rate" hint="Cancellations over everyone at risk that month. Partial months are dimmed.">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr><Th>Month</Th><Th>Activator</Th><Th>Navigator</Th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(c.churn.Activator ?? []).map((r, i) => {
                  const nav = c.churn.Navigator?.[i];
                  return (
                    <tr key={r.month}>
                      <Td>{r.month}</Td>
                      <Td dim={r.partial}>{pct(r.rate)} <span className="text-xs text-zinc-400">({r.lost}/{r.at_risk})</span></Td>
                      <Td dim={nav?.partial}>{pct(nav?.rate ?? null)} <span className="text-xs text-zinc-400">({nav?.lost ?? 0}/{nav?.at_risk ?? 0})</span></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* Reach + campaigns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.reach && (
          <Panel title="YouTube reach" hint="Intake tracks views far more closely than publishing frequency.">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr><Th>Month</Th><Th>Views</Th><Th>Streams</Th><Th>Long</Th><Th>Shorts</Th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.reach.monthly.map((r) => (
                  <tr key={r.month}>
                    <Td>{r.month}{r.partial && <span className="ml-1 text-xs text-zinc-400">(partial)</span>}</Td>
                    <Td dim={r.partial}>{num(r.views)}</Td>
                    <Td dim>{num(r.livestream ?? 0)}</Td><Td dim>{num(r.long ?? 0)}</Td><Td dim>{num(r.short ?? 0)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
        {data.campaigns && (
          <Panel title="Email campaigns" hint="Opens holding while clicks fall is list fatigue, not weak creative.">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr><Th>Month</Th><Th>Sends</Th><Th>Blasts</Th><Th>Emails</Th><Th>Open</Th><Th>CTR</Th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.campaigns.map((r) => (
                  <tr key={r.month}>
                    <Td>{r.month}{r.partial && <span className="ml-1 text-xs text-zinc-400">(partial)</span>}</Td>
                    <Td dim>{num(r.campaigns)}</Td><Td dim>{num(r.blasts)}</Td>
                    <Td>{num(r.sent)}</Td><Td dim>{pct(r.open_rate)}</Td><Td>{pct(r.ctr, 2)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {/* Model parameters */}
      <Panel title="Model parameters" hint="These drive the projection. They are data, not doctrine — retune them as the business moves.">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60">
            <tr><Th>Parameter</Th><Th>Value</Th><Th>Range</Th><Th>Last set by</Th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Object.values(data.params).map((p) => (
              <tr key={p.param_key}>
                <Td>
                  <div>{p.label}</div>
                  <div className="text-xs text-zinc-400">{p.hint}</div>
                </Td>
                <Td>
                  <input
                    type="number"
                    defaultValue={p.param_value}
                    step={p.unit === "rate" ? 0.001 : 1}
                    min={p.min_value}
                    max={p.max_value}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== p.param_value) void saveParam(p.param_key, v);
                    }}
                    className="w-28 rounded border border-zinc-300 px-2 py-1 text-right tabular-nums dark:border-zinc-600 dark:bg-zinc-900"
                  />
                </Td>
                <Td dim>{p.min_value}–{p.max_value}</Td>
                <Td dim>{p.updated_by ?? "seed"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* Freshness */}
      <footer className="rounded-lg border border-zinc-200 p-4 text-xs dark:border-zinc-800">
        <div className="mb-2 font-semibold uppercase tracking-wide text-zinc-500">Source freshness</div>
        <div className="grid gap-2 md:grid-cols-3">
          {Object.entries(data.freshness).map(([name, f]) => (
            <div key={name} className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{name}</span>
              <span className={f.stale ? "text-amber-600 dark:text-amber-400" : "text-zinc-500"}>
                {f.last_success
                  ? `${f.age_minutes}m ago${f.stale ? " · stale" : ""}`
                  : "never pulled"}
                {f.last_status === "failed" && " · last attempt failed"}
              </span>
            </div>
          ))}
        </div>
        {Object.entries(data.freshness).some(([, f]) => f.last_error) && (
          <ul className="mt-2 space-y-1 text-zinc-400">
            {Object.entries(data.freshness).filter(([, f]) => f.last_error).map(([n, f]) => (
              <li key={n}><span className="font-mono">{n}</span>: {f.last_error}</li>
            ))}
          </ul>
        )}
      </footer>
    </div>
  );
}
