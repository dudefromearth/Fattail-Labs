"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMark, fetchQuantDays, fetchSpot, hhmm, runSimulate,
  type MarkResponse, type QuantDay, type SimulateResponse,
} from "@/lib/quantApi";

/**
 * Strategy Lab — Monte Carlo over fills, from the compressed [C][T] store.
 *
 * Member-surface rules enforced HERE, not only on the server (QLAB §4.4,
 * ATRV §3.10): the distribution is the object. No headline mean, no
 * featured p50, no win rate, no "expected". Bands are drawn as a SET.
 * Assumptions are always visible. A withheld mark is a gap, never a bridge.
 */

const MULT = 100; // XSP / SPX contract multiplier — dollars = price × MULT

export default function MonteCarloLab() {
  const [days, setDays] = useState<QuantDay[]>([]);
  const [sel, setSel] = useState<QuantDay | null>(null);
  const [legs, setLegs] = useState("");
  const [mark, setMark] = useState<MarkResponse | null>(null);
  const [tEntry, setTEntry] = useState(0);
  const [tExit, setTExit] = useState(0);
  const [paths, setPaths] = useState(2000);
  const [seed, setSeed] = useState(1);
  const [sim, setSim] = useState<SimulateResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [axis, setAxis] = useState<{ time_ms: number[]; spot: (number | null)[]; strikes: number[] } | null>(null);

  useEffect(() => {
    fetchQuantDays().then((d) => { setDays(d.days); if (d.days[0]) setSel(d.days[0]); })
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  // day changed: load the time/spot axis, reset the study window
  useEffect(() => {
    if (!sel) return;
    setSim(null); setMark(null); setAxis(null);
    setTEntry(Math.floor(sel.T * 0.1)); setTExit(Math.floor(sel.T * 0.6));
    fetchSpot(sel.day, sel.book).then(setAxis).catch((e) => setErr(String(e.message || e)));
  }, [sel]);

  const loadMark = useCallback(async () => {
    if (!sel || !legs.trim()) return;
    setErr(null); setBusy(true);
    try { setMark(await fetchMark(sel.day, sel.book, legs.trim())); }
    catch (e) { setErr(String((e as Error).message || e)); setMark(null); }
    finally { setBusy(false); }
  }, [sel, legs]);

  /** A fly with its body at the nearest LISTED strike to spot at entry, wings one
   *  listed step out. Only strikes the store actually has — never invented. */
  const suggest = useCallback(() => {
    if (!axis) return;
    const spot = axis.spot[tEntry];
    if (spot == null || axis.strikes.length < 3) return;
    const ks = axis.strikes;
    let i = 0; for (let j = 1; j < ks.length; j++) if (Math.abs(ks[j] - spot) < Math.abs(ks[i] - spot)) i = j;
    const lo = ks[Math.max(i - 1, 0)], body = ks[i], hi = ks[Math.min(i + 1, ks.length - 1)];
    setLegs(`${lo}C:+1,${body}C:-2,${hi}C:+1`);
  }, [axis, tEntry]);

  const run = useCallback(async () => {
    if (!sel || !legs.trim()) return;
    setErr(null); setBusy(true);
    try {
      setSim(await runSimulate({ day: sel.day, book: sel.book, legs: legs.trim(),
        t_entry: tEntry, t_exit: tExit, paths, seed }));
    } catch (e) { setErr(String((e as Error).message || e)); setSim(null); }
    finally { setBusy(false); }
  }, [sel, legs, tEntry, tExit, paths, seed]);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Monte Carlo — over fills, on the archived path</h1>
        <p className="text-sm text-[var(--color-label-secondary)]">
          The price path is not simulated; it happened and it is in the store. Only execution is
          random. What comes back is a distribution — never a number.
        </p>
      </header>

      {err && <div role="alert" className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">{err}</div>}

      <section className="grid gap-3 md:grid-cols-[auto_1fr_auto] items-end">
        <label className="text-sm">Day · book
          <select className="block mt-1 rounded border px-2 py-1 bg-transparent"
            value={sel ? `${sel.day}|${sel.book}` : ""}
            onChange={(e) => setSel(days.find((d) => `${d.day}|${d.book}` === e.target.value) || null)}>
            {days.map((d) => <option key={`${d.day}|${d.book}`} value={`${d.day}|${d.book}`}>{d.day} · {d.book} · {d.T.toLocaleString()} snaps · {d.C} contracts</option>)}
          </select>
        </label>
        <label className="text-sm">Legs <span className="text-[var(--color-label-secondary)]">(strike+side:qty, e.g. 628C:+1,630C:-2,632C:+1)</span>
          <input className="block mt-1 w-full rounded border px-2 py-1 bg-transparent font-mono" value={legs}
            onChange={(e) => setLegs(e.target.value)} onBlur={loadMark} placeholder="628C:+1,630C:-2,632C:+1" />
        </label>
        <div className="flex gap-2">
          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={suggest} disabled={!axis}>fly at entry spot</button>
          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={loadMark} disabled={!sel || busy}>load mark</button>
        </div>
      </section>

      {sel && (
        <section className="grid gap-3 md:grid-cols-4 text-sm">
          <Slider label="Entry" t={tEntry} max={sel.T - 2} onChange={(t) => { setTEntry(t); if (t >= tExit) setTExit(Math.min(t + 1, sel.T - 1)); }} times={axis?.time_ms} />
          <Slider label="Exit" t={tExit} max={sel.T - 1} onChange={(t) => setTExit(Math.max(t, tEntry + 1))} times={axis?.time_ms} />
          <label>Paths <input type="number" min={100} max={20000} step={100} className="ml-2 w-24 rounded border px-2 py-1 bg-transparent" value={paths} onChange={(e) => setPaths(Number(e.target.value))} /></label>
          <label>Seed <input type="number" className="ml-2 w-24 rounded border px-2 py-1 bg-transparent" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
            <button type="button" className="ml-3 rounded bg-[var(--color-accent,#2563eb)] px-3 py-1 text-white" onClick={run} disabled={!sel || busy || !legs.trim()}>{busy ? "…" : "Run"}</button>
          </label>
        </section>
      )}

      {mark && <MarkStrip m={mark} tEntry={tEntry} tExit={tExit} />}
      {sim && <Distribution s={sim} />}
    </main>
  );
}

function Slider({ label, t, max, onChange, times }: { label: string; t: number; max: number; onChange: (t: number) => void; times?: number[] }) {
  return (
    <label className="block">{label} <span className="font-mono">{times?.[t] != null ? hhmm(times[t]) : `t=${t}`}</span>
      <input type="range" min={0} max={max} value={t} className="block w-full" onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/** Realized mark through the day. Withheld instants are GAPS — never bridged. */
function MarkStrip({ m, tEntry, tExit }: { m: MarkResponse; tEntry: number; tExit: number }) {
  const W = 1100, H = 180, P = 28;
  const vals = m.mark.map((v) => (v == null ? null : v * MULT));
  const finite = vals.filter((v): v is number => v != null);
  const lo = Math.min(...finite), hi = Math.max(...finite);
  const x = (i: number) => P + (i / Math.max(m.mark.length - 1, 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - lo) / Math.max(hi - lo, 1e-9)) * (H - 2 * P);
  // build segments broken at every withheld instant
  const segs: string[] = []; let cur: string[] = [];
  vals.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur.join(" ")); cur = []; } else cur.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`); });
  if (cur.length) segs.push(cur.join(" "));
  return (
    <section className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--color-label-secondary)]">
        <span>Realized mark, package $ (×{MULT}) · {m.legs.map((l) => `${l.strike}${l.side}:${l.qty > 0 ? "+" : ""}${l.qty}`).join(" ")}</span>
        <span>{m.withheld > 0 ? `${m.withheld} instants withheld — a leg was outside the band (not interpolated)` : "no withheld instants"}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded border" role="img" aria-label="Realized mark through the day">
        {segs.map((d, i) => <polyline key={i} points={d} fill="none" stroke="currentColor" strokeWidth={1.2} />)}
        <line x1={x(tEntry)} x2={x(tEntry)} y1={P} y2={H - P} stroke="#16a34a" strokeDasharray="3 3" />
        <line x1={x(tExit)} x2={x(tExit)} y1={P} y2={H - P} stroke="#dc2626" strokeDasharray="3 3" />
        <text x={P} y={12} fontSize={10} fill="currentColor">{hi.toFixed(0)}</text>
        <text x={P} y={H - 4} fontSize={10} fill="currentColor">{lo.toFixed(0)}</text>
      </svg>
    </section>
  );
}

/** The distribution is the object. ECDF + bands as a set. Nothing featured. */
function Distribution({ s }: { s: SimulateResponse }) {
  const W = 1100, H = 260, P = 32;
  const xs = s.ecdf.x, Fs = s.ecdf.F;
  const lo = xs[0] ?? 0, hi = xs[xs.length - 1] ?? 1;
  const x = (v: number) => P + ((v - lo) / Math.max(hi - lo, 1e-9)) * (W - 2 * P);
  const y = (F: number) => H - P - F * (H - 2 * P);
  const pts = xs.map((v, i) => `${x(v).toFixed(1)},${y(Fs[i]).toFixed(1)}`).join(" ");
  const bandKeys = Object.keys(s.bands) as (keyof typeof s.bands)[];
  const nf = s.no_fill_rate;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-label-secondary)]">
        <span>{s.n.toLocaleString()} paths · {s.n_traded.toLocaleString()} traded · seed {s.seed}</span>
        <span>entry {hhmm(s.time_entry_ms)} → exit {hhmm(s.time_exit_ms)} (acted +{(s.assumptions.latency_snapshots as number) ?? 1} snap)</span>
        <span>modes: <b>{s.modality.n_modes ?? "—"}</b>{s.modality.n_modes && s.modality.n_modes > 1 ? " — bimodal; the middle is the valley" : ""}</span>
        <span>no-fill: entry {(nf.entry * 100).toFixed(1)}% · exit {nf.exit == null ? "—" : `${(nf.exit * 100).toFixed(1)}%`}</span>
        <span>stability: {s.stability.n_half_vs_n == null ? "—" : `${(s.stability.n_half_vs_n * 100).toFixed(1)}% band drift at N/2 ${s.stability.enough ? "(enough)" : "(raise N)"}`}</span>
        <span className="uppercase tracking-wide">{s.fidelity}{s.assumptions.label ? ` · ${s.assumptions.label}` : ""}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded border" role="img" aria-label="Empirical distribution of after-tax P&L">
        <line x1={x(0)} x2={x(0)} y1={P} y2={H - P} stroke="currentColor" strokeOpacity={0.35} />
        {bandKeys.map((k) => (
          <line key={k} x1={x(s.bands[k])} x2={x(s.bands[k])} y1={H - P} y2={H - P + 8} stroke="currentColor" strokeOpacity={0.6} />
        ))}
        {s.modality.valleys.map((v, i) => <line key={`v${i}`} x1={x(v)} x2={x(v)} y1={P} y2={H - P} stroke="#f59e0b" strokeDasharray="2 4" />)}
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.6} />
        <text x={P} y={12} fontSize={10} fill="currentColor">F(x) — share of traded paths at or below x</text>
        <text x={x(lo)} y={H - 6} fontSize={10} fill="currentColor">{lo.toFixed(0)}</text>
        <text x={x(hi) - 30} y={H - 6} fontSize={10} fill="currentColor">{hi.toFixed(0)}</text>
      </svg>
      <div className="grid gap-4 md:grid-cols-2 text-xs">
        <table className="w-full"><caption className="text-left text-[var(--color-label-secondary)] mb-1">After-tax P&L bands — a set; no single band is the answer</caption>
          <tbody><tr>{bandKeys.map((k) => <td key={k} className="font-mono pr-2">{k} {s.bands[k].toFixed(0)}</td>)}</tr></tbody></table>
        <table className="w-full"><caption className="text-left text-[var(--color-label-secondary)] mb-1">Tax paid, per traded path — friction (spread crossed) and fees</caption>
          <tbody>
            <tr><td className="pr-2">friction</td>{(["p10", "p25", "p50", "p75", "p90"] as const).map((k) => <td key={k} className="font-mono pr-2">{k} {s.tax.friction_bands[k].toFixed(0)}</td>)}</tr>
            <tr><td className="pr-2">fees</td>{(["p10", "p25", "p50", "p75", "p90"] as const).map((k) => <td key={k} className="font-mono pr-2">{k} {s.tax.fees_bands[k].toFixed(2)}</td>)}</tr>
          </tbody></table>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-[var(--color-label-secondary)]">Assumptions — always visible on request, never hidden</summary>
        <pre className="mt-2 whitespace-pre-wrap font-mono">{JSON.stringify({ ...s.assumptions, provenance: s.provenance, display_legal: s.display_legal }, null, 2)}</pre>
      </details>
    </section>
  );
}
