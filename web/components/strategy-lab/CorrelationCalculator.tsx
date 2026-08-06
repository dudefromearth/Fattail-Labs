"use client";

/**
 * Any two symbols → Pearson correlation of daily returns.
 */

import { useEffect, useState } from "react";
import {
  fetchCurateSymbolCatalog,
  fetchSymbolCorrelation,
  type CorrelationResult,
  type CurateSymbolRow,
} from "@/lib/strategyLabCurateApi";

export default function CorrelationCalculator() {
  const [symbols, setSymbols] = useState<CurateSymbolRow[]>([]);
  const [a, setA] = useState("SPY");
  const [b, setB] = useState("QQQ");
  const [days, setDays] = useState(60);
  const [result, setResult] = useState<CorrelationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchCurateSymbolCatalog().then((c) => {
      if (c?.symbols?.length) setSymbols(c.symbols);
    });
  }, []);

  async function onCalc() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetchSymbolCorrelation(a, b, days);
      if (r.error) setError(r.error);
      else setResult(r.data || null);
    } finally {
      setBusy(false);
    }
  }

  const groups = ["index", "etf", "equity"] as const;
  const byKind = (k: string) => symbols.filter((s) => s.kind === k);

  function SymbolSelect({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <select
        id={id}
        className="w-full rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1.5 text-sm font-semibold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {groups.map((k) => {
          const rows = byKind(k);
          if (!rows.length) return null;
          return (
            <optgroup
              key={k}
              label={k === "index" ? "Indexes" : k === "etf" ? "ETFs" : "Stocks"}
            >
              {rows.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    );
  }

  const r = result?.coefficient;
  const rTone =
    r == null
      ? ""
      : Math.abs(r) >= 0.7
        ? r >= 0
          ? "text-violet-800"
          : "text-orange-800"
        : "text-[var(--color-label)]";

  return (
    <div
      className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
      data-testid="correlation-calculator"
    >
      <h3 className="text-sm font-semibold text-[var(--color-label)]">
        Correlation calculator
      </h3>
      <p className="mt-0.5 text-[11px] text-[var(--color-label-secondary)]">
        Pearson correlation of <strong>daily simple returns</strong> for any two
        universe symbols (Massive daily bars). Indexes may use labeled proxy
        series (e.g. SPX→SPY) when index feed is not entitled.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="corr-a"
            className="text-[10px] font-semibold uppercase text-[var(--color-label-secondary)]"
          >
            Symbol A
          </label>
          <SymbolSelect id="corr-a" value={a} onChange={setA} />
        </div>
        <div>
          <label
            htmlFor="corr-b"
            className="text-[10px] font-semibold uppercase text-[var(--color-label-secondary)]"
          >
            Symbol B
          </label>
          <SymbolSelect id="corr-b" value={b} onChange={setB} />
        </div>
        <div>
          <label
            htmlFor="corr-days"
            className="text-[10px] font-semibold uppercase text-[var(--color-label-secondary)]"
          >
            Lookback (days)
          </label>
          <select
            id="corr-days"
            className="w-full rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1.5 text-sm font-semibold"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
            <option value={120}>120</option>
            <option value={252}>252 (~1y)</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onCalc()}
        className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? "Calculating…" : "Calculate ρ"}
      </button>

      {error ? (
        <p className="mt-3 text-sm text-rose-600">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={`font-mono text-3xl font-bold tabular-nums ${rTone}`}>
              {result.coefficient >= 0 ? "+" : ""}
              {result.coefficient.toFixed(4)}
            </span>
            <span className="text-sm text-[var(--color-label)]">
              {result.symbol_a} ↔ {result.symbol_b}
            </span>
          </div>
          {result.interpretation ? (
            <p className="mt-1 text-sm font-medium text-[var(--color-label)]">
              {result.interpretation}
            </p>
          ) : null}
          <dl className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-[var(--color-label-secondary)] sm:grid-cols-4">
            <div>
              <dt className="uppercase opacity-70">n returns</dt>
              <dd className="font-mono font-semibold text-[var(--color-label)]">
                {result.n_returns ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="uppercase opacity-70">window</dt>
              <dd className="font-mono text-[var(--color-label)]">
                {result.date_start || "—"} → {result.date_end || "—"}
              </dd>
            </div>
            <div>
              <dt className="uppercase opacity-70">series A</dt>
              <dd className="font-mono text-[var(--color-label)]">
                {result.series_ticker_a || result.symbol_a}
              </dd>
            </div>
            <div>
              <dt className="uppercase opacity-70">series B</dt>
              <dd className="font-mono text-[var(--color-label)]">
                {result.series_ticker_b || result.symbol_b}
              </dd>
            </div>
          </dl>
          {(result.series_note_a || result.series_note_b) && (
            <p className="mt-2 text-[10px] text-[var(--color-label-secondary)]">
              {result.series_note_a}
              {result.series_note_b ? ` · ${result.series_note_b}` : ""}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
