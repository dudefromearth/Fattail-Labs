"use client";

// Admin archive corpus — SO-AR §7.4 content plus C11 hold-resident
// (aggregates only; no who-replayed). Read-only.

import { useCallback, useEffect, useState } from "react";

type MedianRow = {
  day?: string;
  symbol?: string;
  delta_median?: number | null;
  delta_p95?: number | null;
  count?: number | null;
  within_dl609?: number | null;
  within_dl400?: number | null;
};

type CorpusStats = {
  hole?: string | null;
  last_run_at?: string | null;
  last_run_status?: string | null;
  last_run_error?: string | null;
  days_collected?: number | null;
  bytes_total?: number | null;
  flags?: string[];
  medians_by_day?: MedianRow[];
  error?: string;
  api_version?: number;
};

type HoldLargest = {
  day: string;
  symbol: string;
  gen_count: number;
  heap_bytes: number;
  fidelity: number | null;
  created_at: string | null;
};

type HoldSummary = {
  n_holds: number;
  n: number;
  heap_avg: number | null;
  heap_min: number | null;
  heap_max: number | null;
  gen_avg: number | null;
  gen_max: number | null;
  n_over_400mb: number;
  thin_threshold_bytes: number;
  largest: HoldLargest[];
};

const fmt = (n: number) => n.toLocaleString("en-US");

function fmtBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} MB`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} KB`;
  return `${Math.round(n)} B`;
}

function fmtSec(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(2)} s`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
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

function lastSession(rows: MedianRow[] | undefined): MedianRow | null {
  if (!rows?.length) return null;
  const spy = [...rows].reverse().find((r) => (r.symbol || "").toUpperCase() === "SPX");
  return spy ?? rows[rows.length - 1];
}

function alarmsOf(stats: CorpusStats | null): string[] {
  if (!stats) return [];
  const out: string[] = [];
  if (stats.hole === "STATS STALE") out.push("STATS STALE — nightly pass is older than 26 h or missing.");
  if (stats.last_run_status && stats.last_run_status !== "ok") {
    out.push(
      `Last stats run ${stats.last_run_status}${
        stats.last_run_error ? `: ${stats.last_run_error}` : ""
      }`,
    );
  }
  for (const f of stats.flags || []) {
    if (f === "TAP RESTART" || f === "GAP" || f === "partial" || f === "none") {
      out.push(f);
    }
  }
  return out;
}

export default function ArchiveCorpusPanel() {
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [holds, setHolds] = useState<HoldSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch("/api/admin/options-lab/archive/stats", { credentials: "same-origin" }),
        fetch("/api/admin/options-lab/archive/hold-resident", {
          credentials: "same-origin",
        }),
      ]);
      if (!sRes.ok && sRes.status !== 501 && sRes.status !== 404) {
        throw new Error(`stats HTTP ${sRes.status}`);
      }
      if (!hRes.ok) throw new Error(`hold-resident HTTP ${hRes.status}`);
      setStats((await sRes.json()) as CorpusStats);
      setHolds((await hRes.json()) as HoldSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const alarms = alarmsOf(stats);
  const last = lastSession(stats?.medians_by_day);
  const medians = (stats?.medians_by_day || []).filter(
    (r) => (r.symbol || "").toUpperCase() === "SPX" && r.delta_median != null,
  );
  const maxMed = medians.reduce((m, r) => Math.max(m, Number(r.delta_median) || 0), 0) || 1;

  return (
    <main className="space-y-6 p-6" data-testid="admin-archive">
      <header>
        <h1 className="text-2xl font-semibold">Archive · Corpus</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Collector health and Time Machine hold size. Empty alarms are the
          normal state. Hold rows are aggregates — not who replayed what.
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}
      {loading && !stats && !holds && (
        <p className="text-sm text-zinc-400">Loading…</p>
      )}

      <section
        className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        data-testid="admin-archive-alarms"
      >
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Alarms
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Only what needs a human. Empty is normal.
          </p>
        </div>
        {alarms.length ? (
          <ul className="divide-y divide-zinc-50 px-4 py-2 dark:divide-zinc-800/60">
            {alarms.map((a) => (
              <li key={a} className="py-2 text-sm text-amber-800 dark:text-amber-300">
                {a}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-zinc-400">None.</p>
        )}
      </section>

      <section data-testid="admin-archive-last-session">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Last session
        </h2>
        {last ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Day" value={String(last.day || "—")} sub={last.symbol || "SPX"} />
            <StatTile label="Snapshots" value={fmt(Number(last.count || 0))} />
            <StatTile
              label="Median Δ"
              value={fmtSec(last.delta_median ?? null)}
              sub={`p95 ${fmtSec(last.delta_p95 ?? null)}`}
            />
            <StatTile
              label="Inside DL-609"
              value={fmtPct(last.within_dl609 ?? null)}
              sub={`DL-400 leftover ${fmtPct(last.within_dl400 ?? null)}`}
            />
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No measured session yet.</p>
        )}
      </section>

      <section
        className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        data-testid="admin-archive-cadence"
      >
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Cadence drift
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            SPX per-day median. Band is DL-609 [2, 5] s.
          </p>
        </div>
        <div className="px-4 py-4">
          {medians.length ? (
            <div className="flex h-32 items-end gap-[3px]">
              {medians.map((r) => (
                <div
                  key={`${r.day}-${r.symbol}`}
                  className="group relative flex-1"
                  style={{ minWidth: 4 }}
                  title={`${r.day}: ${fmtSec(r.delta_median ?? null)}`}
                >
                  <div
                    className="w-full rounded-t-sm bg-sky-500/80"
                    style={{
                      height: `${((Number(r.delta_median) || 0) / maxMed) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-zinc-400">No medians yet.</p>
          )}
        </div>
      </section>

      <section data-testid="admin-archive-corpus">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Corpus
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            label="Days collected"
            value={stats?.days_collected != null ? fmt(stats.days_collected) : "—"}
            sub={
              stats?.last_run_at
                ? `stats ${stats.last_run_status || "—"} · ${stats.last_run_at}`
                : "no nightly run recorded"
            }
          />
          <StatTile
            label="Store bytes"
            value={fmtBytes(stats?.bytes_total ?? null)}
            sub="Nightly STATS roll-up (marks tapes today)"
          />
          <StatTile
            label="Hold heap avg"
            value={fmtBytes(holds?.heap_avg ?? null)}
            sub={
              holds
                ? `${fmt(holds.n)} with heap · ${fmt(holds.n_holds)} holds`
                : undefined
            }
          />
          <StatTile
            label="Hold heap max"
            value={fmtBytes(holds?.heap_max ?? null)}
            sub={
              holds
                ? `${fmt(holds.n_over_400mb)} ≥ ${fmtBytes(holds.thin_threshold_bytes)}`
                : "C11 watch · 400 MiB line"
            }
          />
        </div>
      </section>

      <section
        className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        data-testid="admin-archive-holds"
      >
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Largest holds
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Resident JS heap after a completed full-fidelity download. No identity.
          </p>
        </div>
        <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
          {(holds?.largest || []).map((r, i) => (
            <li
              key={`${r.day}-${r.symbol}-${r.created_at}-${i}`}
              className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
            >
              <span className="text-zinc-700 dark:text-zinc-200">
                {r.day} · {r.symbol} · {fmt(r.gen_count)} gens
                {r.fidelity != null ? ` · ${fmtPct(r.fidelity)}` : ""}
              </span>
              <span className="tabular-nums text-zinc-500">{fmtBytes(r.heap_bytes)}</span>
            </li>
          ))}
          {!holds?.largest?.length && (
            <li className="px-4 py-6 text-center text-sm text-zinc-400">
              No hold heaps recorded yet.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
