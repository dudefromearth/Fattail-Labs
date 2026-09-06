"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMark, fetchQuantDays, fetchSpot, hhmm, runSimulate, runSweep,
  type Bands, type ExitSpec, type MarkResponse, type QuantDay, type SimulateResponse, type SweepResponse,
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

/** Session window in ET. The capture runs 04:00–20:00 ET; the contract lives 09:30–16:15. */
const RTH_OPEN_MIN = 9 * 60 + 30, RTH_CLOSE_MIN = 16 * 60 + 15;
function etMinutes(ms: number): number {
  const p = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" }).formatToParts(new Date(ms));
  const h = Number(p.find((x) => x.type === "hour")?.value ?? 0), mi = Number(p.find((x) => x.type === "minute")?.value ?? 0);
  return h * 60 + mi;
}
function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const k = (sorted.length - 1) * p, lo = Math.floor(k), hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (k - lo);
}


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
  const [sweep, setSweep] = useState<SweepResponse | null>(null);
  const [stepS, setStepS] = useState(60);
  const [exitKind, setExitKind] = useState<"time" | "target">("target");
  const [targetPct, setTargetPct] = useState(150);
  const exitSpec = (): ExitSpec => (exitKind === "target" ? { exit_kind: "target", target_pct: targetPct } : { exit_kind: "time" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [axis, setAxis] = useState<{ time_ms: number[]; spot: (number | null)[]; strikes: number[] } | null>(null);

  useEffect(() => {
    fetchQuantDays().then((d) => { setDays(d.days); if (d.days[0]) setSel(d.days[0]); })
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  // day changed: load the time/spot axis, then default the window INSIDE the
  // session — the capture starts at midnight ET, so a fraction of T lands at 2 AM
  useEffect(() => {
    if (!sel) return;
    setSim(null); setSweep(null); setMark(null); setAxis(null);
    fetchSpot(sel.day, sel.book).then((ax) => {
      setAxis(ax);
      const at = (mins: number) => { const i = ax.time_ms.findIndex((t) => etMinutes(t) >= mins); return i < 0 ? 0 : i; };
      const e = at(10 * 60), x = at(15 * 60 + 45);
      setTEntry(e); setTExit(x > e ? x : Math.min(e + 1, ax.T - 1));
    }).catch((err) => setErr(String(err.message || err)));
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
        t_entry: tEntry, t_exit: tExit, paths, seed, ...exitSpec() }));
    } catch (e) { setErr(String((e as Error).message || e)); setSim(null); }
    finally { setBusy(false); }
  }, [sel, legs, tEntry, tExit, paths, seed, exitKind, targetPct]);

  /** Every entry from the Entry slider to the Exit, `stepS` seconds apart, one exit. */
  const doSweep = useCallback(async () => {
    if (!sel || !legs.trim()) return;
    setErr(null); setBusy(true);
    try {
      setSweep(await runSweep({ day: sel.day, book: sel.book, legs: legs.trim(),
        t_from: tEntry, t_to: tExit - 2, t_exit: tExit, step: Math.max(1, Math.round(stepS / 2)),
        paths_per_entry: 100, seed, ...exitSpec() }));
    } catch (e) { setErr(String((e as Error).message || e)); setSweep(null); }
    finally { setBusy(false); }
  }, [sel, legs, tEntry, tExit, stepS, seed, exitKind, targetPct]);

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
      {sel && (
        <section className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[var(--color-label-secondary)]">Exit rule</span>
          <label className="cursor-pointer"><input type="radio" name="exit" checked={exitKind === "target"} onChange={() => setExitKind("target")} className="mr-1" />
            first instant the mid-mark reaches <input type="number" min={1} max={2000} step={10} className="mx-1 w-20 rounded border px-2 py-1 bg-transparent" value={targetPct} onChange={(e) => setTargetPct(Number(e.target.value))} />% on the debit, else the Exit time</label>
          <label className="cursor-pointer"><input type="radio" name="exit" checked={exitKind === "time"} onChange={() => setExitKind("time")} className="mr-1" />hold to the Exit time</label>
        </section>
      )}
      {sel && (
        <section className="flex flex-wrap items-end gap-3 text-sm">
          <span className="text-[var(--color-label-secondary)]">Or sweep <b>every entry</b> from the Entry slider to the Exit, one exit, fill Monte Carlo on each —</span>
          <label>every <input type="number" min={2} max={900} step={2} className="mx-1 w-20 rounded border px-2 py-1 bg-transparent" value={stepS} onChange={(e) => setStepS(Number(e.target.value))} /> s</label>
          <button type="button" className="rounded border px-3 py-1" onClick={doSweep} disabled={!sel || busy || !legs.trim()}>{busy ? "…" : "Sweep entries"}</button>
        </section>
      )}

      {mark && <MarkStrip m={mark} tEntry={tEntry} tExit={tExit} />}
      {sim && <Distribution s={sim} />}
      {sweep && <SweepView s={sweep} />}
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

/** Realized mark through the day. Withheld instants are GAPS — never bridged.
 *  Y-range is robust (p1–p99) so one crossed quote at the open cannot flatten
 *  the session; instants outside the range are COUNTED, not hidden. */
function MarkStrip({ m, tEntry, tExit }: { m: MarkResponse; tEntry: number; tExit: number }) {
  const [session, setSession] = useState(true);
  const W = 1100, H = 180, P = 28;
  const n = m.mark.length;
  // window
  let i0 = 0, i1 = n;
  if (session && m.time_ms.length === n) {
    const inRth = m.time_ms.map((t) => { const mm = etMinutes(t); return mm >= RTH_OPEN_MIN && mm <= RTH_CLOSE_MIN; });
    const first = inRth.indexOf(true), last = inRth.lastIndexOf(true);
    if (first >= 0 && last > first) { i0 = first; i1 = last + 1; }
  }
  const vals = m.mark.slice(i0, i1).map((v) => (v == null ? null : v * MULT));
  const finite = vals.filter((v): v is number => v != null).sort((a, b) => a - b);
  const lo = quantile(finite, 0.01), hi = quantile(finite, 0.99);
  const outliers = finite.filter((v) => v < lo || v > hi).length;
  const span = Math.max(hi - lo, 1e-9);
  const x = (i: number) => P + ((i - i0) / Math.max(i1 - i0 - 1, 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (Math.min(Math.max(v, lo), hi) - lo) / span * (H - 2 * P);
  const segs: string[] = []; let cur: string[] = [];
  vals.forEach((v, j) => { if (v == null) { if (cur.length) segs.push(cur.join(" ")); cur = []; } else cur.push(`${x(i0 + j).toFixed(1)},${y(v).toFixed(1)}`); });
  if (cur.length) segs.push(cur.join(" "));
  const withheldInWindow = m.leg_present.slice(i0, i1).filter((p) => !p).length;
  const inWin = (t: number) => t >= i0 && t < i1;
  return (
    <section className="space-y-1">
      <div className="flex flex-wrap justify-between gap-x-4 text-xs text-[var(--color-label-secondary)]">
        <span>Realized mark, package $ (×{MULT}) · {m.legs.map((l) => `${l.strike}${l.side}:${l.qty > 0 ? "+" : ""}${l.qty}`).join(" ")}</span>
        <span className="flex gap-3">
          <label className="cursor-pointer"><input type="checkbox" checked={session} onChange={(e) => setSession(e.target.checked)} className="mr-1" />session only (09:30–16:15 ET)</label>
          <span>{withheldInWindow > 0 ? `${withheldInWindow} instants withheld — a leg was outside the band (not interpolated)` : "no withheld instants"}</span>
          {outliers > 0 && <span title="plotted range is p1–p99 of the window; these instants sit outside it and are clamped, not removed">{outliers} outside plotted range</span>}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded border" role="img" aria-label="Realized mark through the session">
        {segs.map((d, i) => <polyline key={i} points={d} fill="none" stroke="currentColor" strokeWidth={1.2} />)}
        {inWin(tEntry) && <line x1={x(tEntry)} x2={x(tEntry)} y1={P} y2={H - P} stroke="#16a34a" strokeDasharray="3 3" />}
        {inWin(tExit) && <line x1={x(tExit)} x2={x(tExit)} y1={P} y2={H - P} stroke="#dc2626" strokeDasharray="3 3" />}
        <text x={P} y={12} fontSize={10} fill="currentColor">{hi.toFixed(0)}</text>
        <text x={P} y={H - 4} fontSize={10} fill="currentColor">{lo.toFixed(0)}</text>
        {m.time_ms.length === n && <>
          <text x={P} y={H - 14} fontSize={9} fill="currentColor" opacity={0.6}>{hhmm(m.time_ms[i0])}</text>
          <text x={W - P - 44} y={H - 14} fontSize={9} fill="currentColor" opacity={0.6}>{hhmm(m.time_ms[i1 - 1])}</text>
        </>}
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
        {s.exit.kind === "target" && <span>{s.exit.hit ? `target +${s.exit.pct}% HIT — left at ${hhmm(s.time_exit_ms)} (mark $${((s.exit.mark_at_hit ?? 0) * MULT).toFixed(0)} on $${(s.exit.debit_mid * MULT).toFixed(0)} in)` : `target +${s.exit.pct}% not reached — held to exit`}</span>}
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


/** The series answer: the same structure entered at every instant in a window.
 *  Top: how the outcome BANDS move with entry time (p10 / p25 / p50 / p75 / p90,
 *  drawn as a ribbon — a set, nothing featured). Bottom: the pooled ECDF. */
function SweepView({ s }: { s: SweepResponse }) {
  const W = 1100, H = 220, P = 32;
  const ok = s.per_entry.filter((e): e is { t_entry: number; time_ms: number; n_traded: number; bands: Bands } => !("refused" in e));
  const keys = ["p10", "p25", "p50", "p75", "p90"] as const;
  const all = ok.flatMap((e) => keys.map((k) => e.bands[k]));
  const lo = Math.min(...all, 0), hi = Math.max(...all, 0);
  const x = (i: number) => P + (i / Math.max(ok.length - 1, 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - lo) / Math.max(hi - lo, 1e-9)) * (H - 2 * P);
  const line = (k: typeof keys[number]) => ok.map((e, i) => `${x(i).toFixed(1)},${y(e.bands[k]).toFixed(1)}`).join(" ");
  const band = (a: typeof keys[number], b: typeof keys[number]) =>
    ok.map((e, i) => `${x(i).toFixed(1)},${y(e.bands[a]).toFixed(1)}`).join(" ") + " " +
    ok.slice().reverse().map((e, i) => `${x(ok.length - 1 - i).toFixed(1)},${y(e.bands[b]).toFixed(1)}`).join(" ");
  const ecdf = s.ecdf; const elo = ecdf.x[0] ?? 0, ehi = ecdf.x[ecdf.x.length - 1] ?? 1;
  const ex = (v: number) => P + ((v - elo) / Math.max(ehi - elo, 1e-9)) * (W - 2 * P);
  const ey = (F: number) => H - P - F * (H - 2 * P);
  const bandKeys = Object.keys(s.bands) as (keyof Bands)[];
  return (
    <section className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-label-secondary)]">
        <span><b>Entry sweep</b> · {s.entries} entries every {s.window.step * 2}s · {s.paths_per_entry} fill paths each · {s.n_pooled.toLocaleString()} pooled · exit {hhmm(s.time_exit_ms)}</span>
        {s.target && <span>target reached on <b>{s.target.entries_hit}</b> of {s.target.of} entries{s.target.minutes_in_bands ? ` · minutes in trade p10 ${s.target.minutes_in_bands.p10.toFixed(0)} · p50 ${s.target.minutes_in_bands.p50.toFixed(0)} · p90 ${s.target.minutes_in_bands.p90.toFixed(0)}` : ""}</span>}
        <span>modes: <b>{s.modality.n_modes ?? "—"}</b>{(s.modality.n_modes ?? 0) > 1 ? " — the mean would sit in a valley" : ""}</span>
        <span>no-fill at entry: {s.no_fill_rate.entry == null ? "—" : `${(s.no_fill_rate.entry * 100).toFixed(1)}%`}</span>
        <span>stability: {s.stability.n_half_vs_n == null ? "—" : `${(s.stability.n_half_vs_n * 100).toFixed(1)}% ${s.stability.enough ? "(enough)" : "(raise N)"}`}</span>
        {s.refused_entries > 0 && <span>{s.refused_entries} entries refused (a leg absent)</span>}
        <span className="uppercase tracking-wide">{s.fidelity}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded border" role="img" aria-label="Outcome bands by entry time">
        <polygon points={band("p10", "p90")} fill="currentColor" fillOpacity={0.08} stroke="none" />
        <polygon points={band("p25", "p75")} fill="currentColor" fillOpacity={0.14} stroke="none" />
        <polyline points={line("p50")} fill="none" stroke="currentColor" strokeWidth={1.2} strokeDasharray="4 3" />
        <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.35} />
        <text x={P} y={12} fontSize={10} fill="currentColor">after-tax $ by ENTRY time — p10–p90 shade, p25–p75 darker, p50 dashed (a set, not an answer)</text>
        <text x={P} y={H - 4} fontSize={10} fill="currentColor">{lo.toFixed(0)}</text>
        <text x={P + 40} y={H - 4} fontSize={9} fill="currentColor" opacity={0.6}>{ok[0] ? hhmm(ok[0].time_ms) : ""}</text>
        <text x={W - P - 44} y={H - 4} fontSize={9} fill="currentColor" opacity={0.6}>{ok.length ? hhmm(ok[ok.length - 1].time_ms) : ""}</text>
        <text x={P} y={P - 4} fontSize={10} fill="currentColor">{hi.toFixed(0)}</text>
      </svg>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded border" role="img" aria-label="Pooled empirical distribution across all entries">
        <line x1={ex(0)} x2={ex(0)} y1={P} y2={H - P} stroke="currentColor" strokeOpacity={0.35} />
        {bandKeys.map((k) => <line key={k} x1={ex(s.bands[k])} x2={ex(s.bands[k])} y1={H - P} y2={H - P + 8} stroke="currentColor" strokeOpacity={0.6} />)}
        {s.modality.valleys.map((v, i) => <line key={`v${i}`} x1={ex(v)} x2={ex(v)} y1={P} y2={H - P} stroke="#f59e0b" strokeDasharray="2 4" />)}
        <polyline points={ecdf.x.map((v, i) => `${ex(v).toFixed(1)},${ey(ecdf.F[i]).toFixed(1)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth={1.6} />
        <text x={P} y={12} fontSize={10} fill="currentColor">pooled F(x) across every entry — valleys marked</text>
        <text x={ex(elo)} y={H - 6} fontSize={10} fill="currentColor">{elo.toFixed(0)}</text>
        <text x={ex(ehi) - 30} y={H - 6} fontSize={10} fill="currentColor">{ehi.toFixed(0)}</text>
      </svg>
      <div className="text-xs font-mono">{bandKeys.map((k) => <span key={k} className="pr-3">{k} {s.bands[k].toFixed(0)}</span>)}</div>
    </section>
  );
}
