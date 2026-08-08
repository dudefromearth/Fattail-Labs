"use client";

/**
 * Phase 2 process pack — adherence mix + campaign season summary.
 * Host: Retrospective / Journey only (DL-257). Never on Reports/Records.
 * Tag frequency: ProcessTagUsage. No P&L / win-rate by label.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchProcessPack,
  type ProcessPackPayload,
} from "@/lib/tradeLogApi";

type Props = {
  accountId?: number | null;
  fromDay?: string;
  toDay?: string;
  dateFilterActive: boolean;
};

const MIX_ORDER = [
  { key: "followed", label: "Followed", tone: "good" as const },
  { key: "partial", label: "Partial", tone: "mid" as const },
  { key: "broke", label: "Broke", tone: "bad" as const },
  { key: "unknown", label: "Not labeled", tone: "mute" as const },
];

function toneClass(tone: "good" | "mid" | "bad" | "mute"): string {
  switch (tone) {
    case "good":
      return "bg-emerald-500";
    case "mid":
      return "bg-amber-400";
    case "bad":
      return "bg-red-500";
    default:
      return "bg-[var(--color-label-tertiary)] opacity-40";
  }
}

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

export default function ProcessReportPack({
  accountId,
  fromDay,
  toDay,
  dateFilterActive,
}: Props) {
  const [data, setData] = useState<ProcessPackPayload | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "err" | "anon" | "forbidden">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);
    const res = await fetchProcessPack({
      accountId,
      fromDay: dateFilterActive ? fromDay : undefined,
      toDay: dateFilterActive ? toDay : undefined,
      seriesBucket: "day",
    });
    if (!res.ok) {
      if (res.error.kind === "err") {
        setState("err");
        setError(res.error.message);
      } else {
        setState(res.error.kind);
      }
      setData(null);
      return;
    }
    setData(res.data);
    setState("ok");
  }, [accountId, fromDay, toDay, dateFilterActive]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = data?.adherence?.counts;
  const total = data?.adherence?.trade_count ?? 0;
  const maxBar = Math.max(
    counts?.followed ?? 0,
    counts?.partial ?? 0,
    counts?.broke ?? 0,
    counts?.unknown ?? 0,
    1,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="process-report-pack">
      {/* Adherence mix */}
      <section
        className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
        data-testid="adherence-mix"
      >
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2
              className="font-semibold text-[var(--color-label)]"
              style={{ fontSize: "var(--text-headline)" }}
            >
              Adherence mix
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
              Did you follow your process this window? Counts only — not P&amp;L.
            </p>
          </div>
          {data && (
            <span className="rounded-full bg-[var(--color-fill)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-label)]">
              Rate {pct(data.adherence.adherence_rate)}
              <span className="ml-1 font-normal text-[var(--color-label-tertiary)]">
                of labeled
              </span>
            </span>
          )}
        </div>

        {state === "loading" && (
          <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
        )}
        {(state === "err" || state === "anon" || state === "forbidden") && (
          <div className="text-sm text-[var(--color-label-secondary)]">
            <p>
              {state === "anon"
                ? "Sign in to see adherence."
                : state === "forbidden"
                  ? "Reports access required."
                  : "Could not load adherence mix."}
            </p>
            {error && (
              <p className="mt-1 font-mono text-xs opacity-70">{error}</p>
            )}
            <button
              type="button"
              className="mt-2 text-[var(--color-tint)] underline"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        )}
        {state === "ok" && data && total === 0 && (
          <p className="text-sm text-[var(--color-label-tertiary)]">
            No trades in this window. Log fills in{" "}
            <Link href="/app/trade-log" className="text-[var(--color-tint)]">
              Trade Log
            </Link>{" "}
            and set adherence on the sheet.
          </p>
        )}
        {state === "ok" && data && total > 0 && counts && (
          <ul className="space-y-2.5">
            {MIX_ORDER.map((row) => {
              const n = counts[row.key as keyof typeof counts] ?? 0;
              const w = (n / maxBar) * 100;
              return (
                <li key={row.key}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="font-medium text-[var(--color-label)]">
                      {row.label}
                    </span>
                    <span className="tabular-nums text-[var(--color-label-secondary)]">
                      {n}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-fill)]">
                    <div
                      className={`h-full rounded-full ${toneClass(row.tone)}`}
                      style={{ width: `${w}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {state === "ok" && data && data.adherence_rate_series.length > 1 && (
          <div className="mt-4 border-t border-[var(--color-separator)] pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Follow rate by day
            </p>
            <div className="flex h-12 items-end gap-0.5">
              {data.adherence_rate_series.map((p) => {
                const h =
                  p.v == null ? 2 : Math.max(3, Math.round(p.v * 48));
                return (
                  <div
                    key={p.t}
                    className="min-w-0 flex-1 rounded-t-sm bg-[var(--color-tint)]"
                    style={{
                      height: h,
                      opacity: p.v == null ? 0.15 : 0.85,
                    }}
                    title={`${p.t}: ${pct(p.v)} (${p.followed}/${p.decided})`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Campaign summary — hidden cleanly when no campaigns */}
      {state === "ok" && data && !data.has_campaigns ? null : (
        <section
          className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
          data-testid="campaign-summary"
        >
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2
                className="font-semibold text-[var(--color-label)]"
                style={{ fontSize: "var(--text-headline)" }}
              >
                Campaign seasons
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                Trades linked to a season + process adherence — not outcomes.
              </p>
            </div>
            <Link
              href="/app/playbook"
              className="text-xs font-medium text-[var(--color-tint)] hover:underline"
            >
              Playbook / seasons
            </Link>
          </div>

          {state === "loading" && (
            <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
          )}
          {state === "ok" && data?.has_campaigns && (
            <ul className="divide-y divide-[var(--color-separator)]">
              {data.campaigns.map((c) => (
                <li
                  key={c.campaign_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-label)]">
                      {c.title}
                      {c.status ? (
                        <span className="ml-2 rounded-full bg-[var(--color-fill)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                          {c.status}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--color-label-tertiary)]">
                      {c.trade_count} trade{c.trade_count === 1 ? "" : "s"}
                      {c.decided_count > 0
                        ? ` · ${c.decided_count} labeled`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-label-tertiary)]">
                      Follow rate
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-[var(--color-label)]">
                      {pct(c.adherence_rate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
