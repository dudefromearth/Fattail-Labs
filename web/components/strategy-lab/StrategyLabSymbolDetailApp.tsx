"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  LiveDayPct,
  LiveMarksStatus,
  LiveMid,
  LiveProxyMid,
} from "@/components/market/LiveMid";
import StrategyLabChrome from "@/components/strategy-lab/StrategyLabChrome";
import { formatUnderlierMid } from "@/lib/market/liveUnderlierPattern";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";
import {
  fetchCurateSymbolDetail,
  type CurateSymbolDetail,
} from "@/lib/strategyLabCurateApi";

export default function StrategyLabSymbolDetailApp({
  symbol,
}: {
  symbol: string;
}) {
  const [detail, setDetail] = useState<CurateSymbolDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const symKey = symbol.toUpperCase();

  // Live mid — site-wide pattern (not ad-hoc detail poll for price)
  const { bySymbol, transport, lastHttpAt, tick } = useLiveUnderlierMarks({
    enabledOnly: false,
    pollMs: 5000,
    symbols: [symKey],
  });
  const liveMark = bySymbol.get(symKey);

  // Static metadata (role, note, related) — slower poll
  const load = useCallback(async () => {
    const d = await fetchCurateSymbolDetail(symbol);
    if (!d) {
      setErr("Symbol not found in universe");
      setDetail(null);
    } else {
      setErr(null);
      setDetail(d);
    }
  }, [symbol]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  const viaProxy = liveMark?.viaProxy ?? Boolean(detail?.is_proxy);
  const prevClose = liveMark?.prevClose ?? detail?.prev_close ?? null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <StrategyLabChrome
        active="development"
        designSub="symbols"
        subtitle={`${symKey} — shared stream info for Design (back test / forward walk) and Curate sim.`}
      >
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/app/strategy-lab/symbols"
              className="text-blue-600 hover:underline"
            >
              ← All symbols
            </Link>
            <span className="text-[var(--color-label-secondary)]">·</span>
            <Link
              href="/app/strategy-lab?phase=development"
              className="text-blue-600 hover:underline"
            >
              Design board
            </Link>
            <span className="text-[var(--color-label-secondary)]">·</span>
            <Link
              href="/app/strategy-lab?phase=curation"
              className="text-blue-600 hover:underline"
            >
              Curate
            </Link>
            <span className="text-[var(--color-label-secondary)]">·</span>
            <LiveMarksStatus
              transport={transport}
              lastHttpAt={lastHttpAt}
              tick={tick}
            />
          </div>

          {err ? <p className="text-sm text-rose-600">{err}</p> : null}

          {!detail && !err ? (
            <p className="text-sm text-[var(--color-label-secondary)]">
              Loading…
            </p>
          ) : null}

          {detail ? (
            <>
              <header className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="font-mono text-3xl font-bold text-[var(--color-label)]">
                      {detail.symbol}
                      {viaProxy ? (
                        <span className="ml-2 text-sm font-semibold text-sky-700">
                          ~proxy
                        </span>
                      ) : null}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                      {detail.kind_label} · role: {detail.role}
                      {detail.options_cadence
                        ? ` · ${detail.options_cadence}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl">
                      <LiveMid
                        mark={liveMark}
                        digits={2}
                        className="!text-3xl"
                      />
                    </div>
                    {viaProxy ? (
                      <div className="mt-0.5">
                        <LiveProxyMid mark={liveMark} />
                      </div>
                    ) : null}
                    <div className="mt-1 flex items-center justify-end gap-1 text-sm tabular-nums">
                      <span className="text-[var(--color-label-secondary)]">
                        prev {formatUnderlierMid(prevClose)}
                      </span>
                      <span className="text-[var(--color-label-tertiary)]">
                        ·
                      </span>
                      <LiveDayPct mark={liveMark} />
                    </div>
                  </div>
                </div>
                {detail.note ? (
                  <p className="mt-3 text-sm text-[var(--color-label)]">
                    {detail.note}
                  </p>
                ) : null}
              </header>

              <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Day open", detail.day_open],
                  ["Day high", detail.day_high],
                  ["Day low", detail.day_low],
                  ["Prev close", detail.prev_close],
                ].map(([lab, val]) => (
                  <div
                    key={String(lab)}
                    className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2"
                  >
                    <div className="text-[10px] font-semibold uppercase text-[var(--color-label-secondary)]">
                      {lab}
                    </div>
                    <div className="font-mono text-sm font-semibold tabular-nums">
                      {typeof val === "number" ? val.toFixed(2) : "—"}
                    </div>
                  </div>
                ))}
              </section>

              <section className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 text-sm">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-label-secondary)]">
                  Feed & usage
                </h2>
                <dl className="mt-2 space-y-1.5 text-[13px]">
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-[var(--color-label-secondary)]">
                      Feed ticker
                    </dt>
                    <dd className="font-mono">
                      {detail.feed_symbol || detail.symbol}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-[var(--color-label-secondary)]">
                      Proxy
                    </dt>
                    <dd className="font-mono">
                      {detail.proxy_symbol || "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-[var(--color-label-secondary)]">
                      Source
                    </dt>
                    <dd className="break-all text-[var(--color-label-secondary)]">
                      {detail.source || "—"}
                      {detail.label ? ` · ${detail.label}` : ""}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-[var(--color-label-secondary)]">
                      Usage
                    </dt>
                    <dd>{detail.info.usage}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-[var(--color-label-secondary)]">
                      Scan open
                    </dt>
                    <dd>
                      {detail.can_scan_open
                        ? "Yes — selectable in Curate"
                        : "No — reference only (e.g. VIX / VIX1D)"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] text-[var(--color-label-secondary)]">
                  {detail.info.honesty}
                </p>
              </section>

              {detail.related?.length ? (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-label-secondary)]">
                    Related {detail.kind_label}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {detail.related.map((s) => (
                      <Link
                        key={s}
                        href={`/app/strategy-lab/symbols/${encodeURIComponent(s)}`}
                        className="rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 font-mono text-xs font-semibold hover:border-blue-400"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {detail.can_scan_open ? (
                <Link
                  href="/app/strategy-lab?phase=curation"
                  className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Use in Curate →
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </StrategyLabChrome>
    </main>
  );
}
