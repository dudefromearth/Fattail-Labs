"use client";

// Admin Stats — site traffic. How many people land on the site, where they come
// from (referrer + UTM), and users vs non-users. Read-only.
// Data: /api/admin/stats/traffic (landing_events, migration 125).

import { useCallback, useEffect, useState } from "react";

type Totals = {
  pageviews: number;
  sessions: number;
  visitors: number;
  authed_views: number;
  anon_views: number;
  authed_visitors: number;
  anon_visitors: number;
};
type DailyRow = { day: string; sessions: number; authed: number; anon: number };
type Breakdown = { label: string; sessions: number };
type TrafficData = {
  days: number;
  totals: Totals;
  daily: DailyRow[];
  by_source: Breakdown[];
  by_medium: Breakdown[];
  by_campaign: Breakdown[];
  by_referrer: Breakdown[];
  by_landing_page: Breakdown[];
};

const DAYS: { key: number; label: string }[] = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
  { key: 365, label: "1 year" },
];

const fmt = (n: number) => n.toLocaleString("en-US");

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function BreakdownTable({
  title,
  hint,
  rows,
}: {
  title: string;
  hint: string;
  rows: Breakdown[];
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.sessions), 0) || 1;
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>
      </div>
      <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
        {rows.map((r) => (
          <li key={r.label} className="px-4 py-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-zinc-700 dark:text-zinc-200" title={r.label}>
                {r.label}
              </span>
              <span className="tabular-nums text-zinc-500">{fmt(r.sessions)}</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-1 rounded-full bg-emerald-400/70"
                style={{ width: `${(r.sessions / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
        {!rows.length && (
          <li className="px-4 py-6 text-center text-sm text-zinc-400">No data yet.</li>
        )}
      </ul>
    </section>
  );
}

function DailyChart({ rows }: { rows: DailyRow[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.sessions), 0) || 1;
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Landings per day
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          New sessions each day —{" "}
          <span className="text-sky-600 dark:text-sky-400">members</span> vs{" "}
          <span className="text-zinc-500">anonymous</span>.
        </p>
      </div>
      <div className="px-4 py-4">
        {rows.length ? (
          <div className="flex h-40 items-end gap-[3px]">
            {rows.map((r) => {
              const h = (r.sessions / max) * 100;
              const authedH = r.sessions ? (r.authed / r.sessions) * h : 0;
              return (
                <div
                  key={r.day}
                  className="group relative flex-1"
                  style={{ minWidth: 2 }}
                  title={`${r.day}: ${fmt(r.sessions)} landings (${fmt(r.authed)} members, ${fmt(r.anon)} anon)`}
                >
                  <div className="flex h-40 flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-zinc-300 dark:bg-zinc-700"
                      style={{ height: `${h}%` }}
                    >
                      <div
                        className="w-full rounded-t-sm bg-sky-500/80"
                        style={{ height: `${h ? (authedH / h) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-zinc-400">No landings in range.</p>
        )}
      </div>
    </section>
  );
}

export default function AdminStatsPage() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/stats/traffic?days=${d}`, {
        credentials: "same-origin",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData((await r.json()) as TrafficData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [load, days]);

  const t = data?.totals;

  return (
    <main className="space-y-6 p-6" data-testid="admin-stats">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stats · Traffic</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            How many people land on the site, where they come from (referrer + UTM),
            and members vs anonymous visitors. Excludes admin pages and known bots.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => (
            <Pill key={d.key} active={days === d.key} onClick={() => setDays(d.key)}>
              {d.label}
            </Pill>
          ))}
        </div>
      </header>

      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}
      {loading && !data && <p className="text-sm text-zinc-400">Loading…</p>}

      {t && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label="Unique visitors"
              value={fmt(t.visitors)}
              sub={`${fmt(t.authed_visitors)} members · ${fmt(t.anon_visitors)} anonymous`}
            />
            <StatTile
              label="Landings (sessions)"
              value={fmt(t.sessions)}
              sub="First page of a browsing session"
            />
            <StatTile
              label="Page views"
              value={fmt(t.pageviews)}
              sub={`${fmt(t.authed_views)} members · ${fmt(t.anon_views)} anon`}
            />
            <StatTile
              label="Members vs non"
              value={`${fmt(t.authed_visitors)} / ${fmt(t.anon_visitors)}`}
              sub={
                t.visitors
                  ? `${Math.round((t.authed_visitors / t.visitors) * 100)}% signed in`
                  : "—"
              }
            />
          </div>

          <DailyChart rows={data.daily} />

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable
              title="Referrer"
              hint="Where the session came from ((direct) = typed / bookmark / no referrer)."
              rows={data.by_referrer}
            />
            <BreakdownTable
              title="UTM source"
              hint="utm_source on the landing URL ((none) = no UTM tag)."
              rows={data.by_source}
            />
            <BreakdownTable
              title="UTM medium"
              hint="utm_medium — e.g. email, cpc, social."
              rows={data.by_medium}
            />
            <BreakdownTable
              title="UTM campaign"
              hint="utm_campaign — the named campaign."
              rows={data.by_campaign}
            />
            <BreakdownTable
              title="Top landing pages"
              hint="The first page visitors land on."
              rows={data.by_landing_page}
            />
          </div>
        </>
      )}
    </main>
  );
}
