"use client";

// Help-desk analytics + the escalation-driven doc-gap report.
// Data: GET /api/admin/help/analytics. No chart lib — plain CSS bars/tiles so the
// build stays dependency-free.

import { useEffect, useState } from "react";

type Analytics = {
  range_days: number;
  total: number;
  by_status: Record<string, number>;
  volume_30d: { day: string; n: number }[];
  ai_resolve_rate_all_time: number | null;
  first_response_avg_hours: number | null;
  first_response_count: number;
  resolution_avg_hours: number | null;
  resolution_count: number;
  reopened_now: number;
  ratings: { up: number; down: number };
  hotspots: { area: string; n: number }[];
  bad_answers: { question_id: number; subject: string; created_at: string | null; excerpt: string }[];
  events: {
    total: number; resolved: number; deflection_rate: number | null; doc_miss: number;
    cost_total_usd: number; avg_cost_usd: number | null; cost_per_resolution_usd: number | null;
  };
  doc_gaps: { topic: string; area: string; n: number }[];
};

function pct(v: number | null): string {
  return v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`;
}
function hrs(v: number | null): string {
  if (v === null || v === undefined) return "—";
  if (v < 1) return `${Math.round(v * 60)}m`;
  if (v < 48) return `${v}h`;
  return `${Math.round(v / 24)}d`;
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone || ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

export default function HelpAnalyticsPage() {
  const [a, setA] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/help/analytics", { credentials: "same-origin" });
      if (!r.ok) { setError(r.status === 403 ? "Administrator sign-in required." : await r.text()); return; }
      setA(await r.json());
    })();
  }, []);

  if (error) return <main className="p-6"><p className="text-sm text-red-600">{error}</p></main>;
  if (!a) return <main className="p-6"><p className="text-sm text-zinc-400">Loading…</p></main>;

  const volMax = Math.max(1, ...a.volume_30d.map((d) => d.n));
  const hotMax = Math.max(1, ...a.hotspots.map((h) => h.n));
  const sat = a.ratings.up + a.ratings.down;

  return (
    <main className="space-y-6 p-6" data-testid="admin-help-analytics">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Help analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">Concierge deflection, response times, and the escalation-driven doc backlog.</p>
        </div>
        <a href="/admin/help" className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:border-zinc-400 dark:border-zinc-700">← Back to queue</a>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Tile label="Total tickets" value={String(a.total)} />
        <Tile label="Open" value={String(a.by_status.open || 0)} tone="text-orange-600 dark:text-orange-400" />
        <Tile label="AI resolve rate" value={pct(a.ai_resolve_rate_all_time)} sub="all-time (bot-resolved / all)" />
        <Tile label="1st response" value={hrs(a.first_response_avg_hours)} sub={`avg · n=${a.first_response_count}`} />
        <Tile label="Resolution" value={hrs(a.resolution_avg_hours)} sub={`avg · n=${a.resolution_count}`} />
        <Tile label="Re-opened now" value={String(a.reopened_now)} sub="member replied back" tone={a.reopened_now ? "text-amber-600 dark:text-amber-400" : ""} />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Tile label="AI satisfaction" value={sat ? pct(a.ratings.up / sat) : "—"} sub={`👍 ${a.ratings.up} · 👎 ${a.ratings.down}`} />
        <Tile label="Deflection (live)" value={pct(a.events.deflection_rate)} sub={`n=${a.events.total} events`} />
        <Tile label="Doc-miss (live)" value={String(a.events.doc_miss)} sub="AI had no reference" tone={a.events.doc_miss ? "text-red-600 dark:text-red-400" : ""} />
        <Tile label="Cost / resolution" value={a.events.cost_per_resolution_usd != null ? `$${a.events.cost_per_resolution_usd}` : "—"} />
        <Tile label="AI spend (total)" value={`$${a.events.cost_total_usd}`} sub="logged since deploy" />
        <Tile label="Answered" value={String(a.by_status.answered || 0)} tone="text-emerald-600 dark:text-emerald-400" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 text-sm font-semibold">Volume — last 30 days</h2>
          {a.volume_30d.length === 0 ? (
            <p className="text-sm text-zinc-400">No tickets in the last 30 days.</p>
          ) : (
            <div className="flex h-32 items-end gap-1">
              {a.volume_30d.map((d) => (
                <div key={d.day} className="flex-1" title={`${d.day}: ${d.n}`}>
                  <div className="mx-auto w-full rounded-t bg-emerald-400/80 dark:bg-emerald-500/70"
                    style={{ height: `${Math.max(4, (d.n / volMax) * 112)}px` }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">Escalation hotspots — the doc backlog</h2>
          <p className="mb-3 text-xs text-zinc-500">Open tickets with no team reply, by the area the member was on. The biggest bars are where a help doc is most missing.</p>
          {a.hotspots.length === 0 ? (
            <p className="text-sm text-zinc-400">No un-answered open tickets. 🎉</p>
          ) : (
            <ul className="space-y-1.5">
              {a.hotspots.map((h) => (
                <li key={h.area} className="flex items-center gap-2 text-sm">
                  <span className="w-40 shrink-0 truncate font-mono text-xs text-zinc-600 dark:text-zinc-400" title={h.area}>{h.area}</span>
                  <span className="h-4 rounded bg-orange-400/80 dark:bg-orange-500/70" style={{ width: `${(h.n / hotMax) * 100}%`, minWidth: "8px" }} />
                  <span className="text-xs text-zinc-500">{h.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">AI doc gaps — questions the bot had no doc for</h2>
          <p className="mb-3 text-xs text-zinc-500">From live concierge events (reference_hit = false). Populates as members ask once the AI is back online. Each row is a doc worth writing.</p>
          {a.doc_gaps.length === 0 ? (
            <p className="text-sm text-zinc-400">No doc-miss events logged yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500"><tr><th className="py-1">Topic</th><th className="py-1">Area</th><th className="py-1 text-right">Misses</th></tr></thead>
              <tbody>
                {a.doc_gaps.map((g, i) => (
                  <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1 capitalize">{g.topic}</td>
                    <td className="py-1 font-mono text-xs text-zinc-500">{g.area}</td>
                    <td className="py-1 text-right">{g.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">Bad AI answers — member gave 👎</h2>
          <p className="mb-3 text-xs text-zinc-500">The concierge answers members down-rated. Review these for wrong or unhelpful replies.</p>
          {a.bad_answers.length === 0 ? (
            <p className="text-sm text-zinc-400">No down-rated answers. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {a.bad_answers.map((b, i) => (
                <li key={i} className="rounded-md border-l-4 border-l-red-400 bg-red-50/60 p-2 text-sm dark:bg-red-950/20">
                  <a href={`/admin/help?q=${b.question_id}`} className="font-medium hover:underline">{b.subject}</a>
                  <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{b.excerpt}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
