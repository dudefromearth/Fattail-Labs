"use client";

/**
 * Shared live marks stream status — one stream, all members.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getJSON } from "@/lib/client";

type Mark = {
  symbol: string;
  mid: number;
  age_seconds: number | null;
  stale: boolean;
  source: string;
  label?: string;
  prev_close?: number | null;
  day_change_pct?: number | null;
};

type VolRef = {
  vix_mid: number | null;
  vix_prev_close: number | null;
  vix_day_change_pct: number | null;
  vix_is_proxy: boolean | null;
  vix_source: string | null;
  vix1d_mid: number | null;
  vix1d_prev_close: number | null;
  vix1d_day_change_pct: number | null;
  vix1d_is_proxy: boolean | null;
  vix1d_source: string | null;
  note: string;
};

type Payload = {
  heartbeat: {
    status: string;
    last_ok_at: string | null;
    last_ok_age_seconds: number | null;
    last_error: string | null;
    stale_seconds_policy: number;
    shared: boolean;
    note: string;
  };
  universe: {
    symbol: string;
    kind: string;
    role?: string;
    options_cadence?: string | null;
    note?: string | null;
  }[];
  marks: Mark[];
  fresh_count: number;
  stale_count: number;
  vol_reference?: VolRef;
};

function VolCard({
  title,
  subtitle,
  mid,
  prev,
  chg,
  proxy,
  source,
}: {
  title: string;
  subtitle: string;
  mid: number | null;
  prev: number | null;
  chg: number | null;
  proxy: boolean;
  source: string | null;
}) {
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
            {mid != null ? mid.toFixed(2) : "—"}
          </div>
          <div className={`text-[10px] tabular-nums ${chgTone}`}>
            prev {prev != null ? prev.toFixed(2) : "—"}
            {chg != null
              ? ` · ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`
              : ""}
          </div>
        </div>
      </div>
      {source ? (
        <div className="mt-1 truncate text-[9px] text-[var(--color-label-secondary)]">
          {source}
        </div>
      ) : null}
    </div>
  );
}

export default function CurateLiveMarksStrip() {
  const [data, setData] = useState<Payload | null>(null);

  const load = useCallback(async () => {
    const r = await getJSON<Payload>("/api/me/strategy-lab/curate/live-marks");
    setData(r);
  }, []);

  useEffect(() => {
    // HTTP hydrate (bus-first server payload) + faster refresh than 15s legacy.
    // Underlier SoR is Market Bus; this poll only re-reads the shared API.
    void load();
    let t: number | null = null;
    const start = () => {
      if (t != null) return;
      t = window.setInterval(() => {
        if (document.visibilityState === "visible") void load();
      }, 5000);
    };
    const stop = () => {
      if (t != null) {
        window.clearInterval(t);
        t = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void load();
        start();
      } else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  if (!data) {
    return (
      <p className="text-[11px] text-[var(--color-label-secondary)]">
        Loading shared live marks…
      </p>
    );
  }

  const hb = data.heartbeat;
  const statusTone =
    hb.status === "running"
      ? "text-emerald-700"
      : hb.status === "error"
        ? "text-rose-700"
        : "text-[var(--color-label-secondary)]";

  const vol = (data as Payload & { vol_reference?: VolRef }).vol_reference;

  return (
    <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            Shared live marks stream
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-label-secondary)]">
            {hb.note || "One stream for every member collection — not per-user sockets."}{" "}
            <Link
              href="/app/strategy-lab/symbols"
              className="font-semibold text-blue-600 hover:underline"
            >
              Symbol info →
            </Link>
          </p>
        </div>
        <div className={`text-xs font-bold uppercase ${statusTone}`}>
          stream: {hb.status}
          {hb.last_ok_age_seconds != null
            ? ` · last ok ${Math.round(hb.last_ok_age_seconds)}s ago`
            : ""}
        </div>
      </div>

      {vol ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <VolCard
            title="VIX"
            subtitle="30-day IV regime"
            mid={vol.vix_mid}
            prev={vol.vix_prev_close}
            chg={vol.vix_day_change_pct}
            proxy={!!vol.vix_is_proxy}
            source={vol.vix_source}
          />
          <VolCard
            title="Daily VIX (VIX1D)"
            subtitle="1-day IV — 0DTE / daily decisions"
            mid={vol.vix1d_mid}
            prev={vol.vix1d_prev_close}
            chg={vol.vix1d_day_change_pct}
            proxy={!!vol.vix1d_is_proxy}
            source={vol.vix1d_source}
          />
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {data.universe.map((u) => {
          const m = data.marks.find((x) => x.symbol === u.symbol);
          const proxy = m?.source?.includes("proxy");
          return (
            <span
              key={u.symbol}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                m && !m.stale && !proxy
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : m && proxy
                    ? "border-sky-300 bg-sky-50 text-sky-900"
                    : m?.stale
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)]"
              }`}
              title={
                m
                  ? `${m.label || m.source} · age=${m.age_seconds} · ${u.kind} · ${u.options_cadence || ""}`
                  : `${u.kind} · ${u.note || "no mark yet"}`
              }
            >
              <Link
                href={`/app/strategy-lab/symbols/${encodeURIComponent(u.symbol)}`}
                className="hover:underline"
              >
                <span className="opacity-60 text-[9px]">{u.kind[0]} </span>
                {u.symbol}
                {m ? ` ${m.mid.toFixed(2)}` : " —"}
                {proxy ? " ~" : ""}
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
        Fresh {data.fresh_count} · Stale {data.stale_count} · Stale policy{" "}
        {hb.stale_seconds_policy}s · Refresh 10s
        {hb.last_error ? (
          <span className="text-rose-600"> · err: {hb.last_error}</span>
        ) : null}
      </div>
    </div>
  );
}
