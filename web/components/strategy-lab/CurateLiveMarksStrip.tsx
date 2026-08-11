"use client";

/**
 * Curate shared live marks strip — site-wide live underlier pattern.
 * Mids: useLiveUnderlierMarks (HTTP ensure_fresh + WS bind).
 * No ad-hoc /curate/live-marks poll for mid chips.
 */

import Link from "next/link";
import { LiveMarksStatus } from "@/components/market/LiveMid";
import {
  formatUnderlierMid,
  type BoundUnderlierMark,
} from "@/lib/market/liveUnderlierPattern";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";

function VolCard({
  title,
  subtitle,
  mark,
}: {
  title: string;
  subtitle: string;
  mark: BoundUnderlierMark | null | undefined;
}) {
  const mid = mark?.mid ?? mark?.proxyMid ?? null;
  const proxy = Boolean(mark?.viaProxy);
  const prev = mark?.prevClose ?? null;
  const chg = mark?.dayChangePct ?? null;
  const chgTone =
    chg == null
      ? "text-[var(--color-label-secondary)]"
      : chg >= 0
        ? "text-rose-700"
        : "text-emerald-700";
  return (
    <div className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-[var(--color-label)]">
            {title}
            {proxy ? (
              <span className="ml-1 text-[10px] font-semibold text-sky-700">
                ~proxy
              </span>
            ) : null}
          </div>
          <div className="text-[10px] text-[var(--color-label-secondary)]">
            {subtitle}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold tabular-nums text-[var(--color-label)]">
            {formatUnderlierMid(mid)}
          </div>
          <div className={`text-[10px] tabular-nums ${chgTone}`}>
            prev {formatUnderlierMid(prev)}
            {chg != null ? ` · ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%` : ""}
          </div>
        </div>
      </div>
      {mark?.source || mark?.plane ? (
        <div className="mt-1 truncate text-[9px] text-[var(--color-label-secondary)]">
          {[mark.plane, mark.source, mark.feedUsed].filter(Boolean).join(" · ")}
        </div>
      ) : null}
    </div>
  );
}

export default function CurateLiveMarksStrip() {
  const { rows, bySymbol, transport, error, lastHttpAt, tick } =
    useLiveUnderlierMarks({
      enabledOnly: true,
      pollMs: 5000,
    });

  const vix = bySymbol.get("VIX");
  const vix1d = bySymbol.get("VIX1D");

  const fresh = rows.filter(
    (r) => r.mark.mid != null && !r.mark.stale && !r.mark.viaProxy,
  ).length;
  const stale = rows.filter(
    (r) => r.mark.viaProxy || r.mark.stale || r.mark.mid == null,
  ).length;

  if (!rows.length && !error) {
    return (
      <p className="text-[11px] text-[var(--color-label-secondary)]">
        Loading shared live marks…
      </p>
    );
  }

  return (
    <div
      className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/50 p-3"
      data-testid="curate-live-marks-strip"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            Shared live marks
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-label-secondary)]">
            Site-wide underlier pattern (HTTP ensure_fresh + Market Bus). One
            stream for every member — not per-user sockets.{" "}
            <Link
              href="/app/strategy-lab/symbols"
              className="font-semibold text-blue-600 hover:underline"
            >
              Symbol info →
            </Link>
          </p>
        </div>
        <LiveMarksStatus
          transport={transport}
          lastHttpAt={lastHttpAt}
          tick={tick}
        />
      </div>

      {error ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <VolCard
          title="VIX"
          subtitle="30-day IV regime"
          mark={vix}
        />
        <VolCard
          title="Daily VIX (VIX1D)"
          subtitle="1-day IV — 0DTE / daily decisions"
          mark={vix1d}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {rows.map((u) => {
          const m = u.mark;
          const hasNative = m.mid != null && !m.viaProxy;
          const proxy = m.viaProxy;
          const display =
            m.mid != null ? m.mid : m.proxyMid != null ? m.proxyMid : null;
          return (
            <span
              key={u.symbol}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                hasNative
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : proxy
                    ? "border-sky-300 bg-sky-50 text-sky-900"
                    : m.stale
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)]"
              }`}
              title={[
                m.plane,
                m.source,
                m.feedUsed,
                `age=${m.ageSeconds ?? "—"}`,
                u.kind,
                u.options_cadence || "",
              ]
                .filter(Boolean)
                .join(" · ")}
              data-testid={`curate-mark-chip-${u.symbol}`}
              data-symbol={u.symbol}
            >
              <Link
                href={`/app/strategy-lab/symbols/${encodeURIComponent(u.symbol)}`}
                className="hover:underline"
              >
                <span className="text-[9px] opacity-60">
                  {(u.kind || "?")[0]}{" "}
                </span>
                {u.symbol}
                {display != null
                  ? ` ${formatUnderlierMid(display)}`
                  : " —"}
                {proxy && display != null ? " ~" : ""}
              </Link>
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-[var(--color-label-secondary)]">
        Indexes SPX/XSP/VIX · ETFs · Mag7 stocks · ~ = proxy mid until index feed
        entitled
      </p>

      <div className="mt-2 text-[10px] text-[var(--color-label-secondary)]">
        Fresh {fresh} · Stale/proxy {stale} · Poll 5s
      </div>
    </div>
  );
}
