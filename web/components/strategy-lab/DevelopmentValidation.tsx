"use client";

/**
 * Design-phase gate: Back test (IS) → Forward walk → Deployed → Curate.
 * Curate is paper/live prep; Design validates settings first.
 */

import { useCallback, useEffect, useState } from "react";
import {
  fetchValidation,
  runBacktest,
  runForwardWalk,
  type StrategyLabStrategy,
  type StrategyValidationStatus,
  type ValidationResultEntry,
} from "@/lib/strategyLabApi";

type Props = {
  strategy: StrategyLabStrategy;
  onUpdated?: () => void;
};

function StatusPill({
  ok,
  label,
}: {
  ok: boolean | null;
  label: string;
}) {
  const cls =
    ok === true
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      : ok === false
        ? "bg-red-100 text-red-800"
        : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function MetricsBlock({
  title,
  entry,
}: {
  title: string;
  entry?: ValidationResultEntry;
}) {
  if (!entry) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-4 text-xs text-[var(--color-label-secondary)]">
        {title}: not run yet
      </div>
    );
  }
  const m = entry.metrics || {};
  const prov = entry.data_provenance;
  return (
    <div className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-2 text-xs">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
        <span className="font-semibold text-[var(--color-label)]">{title}</span>
        <StatusPill
          ok={entry.status === "pass" || entry.status === "completed"}
          label={String(entry.status || "—")}
        />
      </div>
      <p className="text-[var(--color-label-secondary)]">
        {String(m.label || m.note || "")}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 tabular-nums sm:grid-cols-3">
        {m.trades != null && (
          <>
            <dt className="text-[var(--color-label-secondary)]">Trades</dt>
            <dd className="font-medium col-span-1 sm:col-span-2">{String(m.trades)}</dd>
          </>
        )}
        {m.max_drawdown_dollars != null && (
          <>
            <dt className="text-[var(--color-label-secondary)]">Max DD</dt>
            <dd className="font-medium col-span-1 sm:col-span-2">
              ${String(m.max_drawdown_dollars)}
            </dd>
          </>
        )}
        {m.net_pnl_dollars != null && (
          <>
            <dt className="text-[var(--color-label-secondary)]">Net P&amp;L</dt>
            <dd className="font-medium col-span-1 sm:col-span-2">
              ${String(m.net_pnl_dollars)}
            </dd>
          </>
        )}
        {m.return_over_avg_dd != null && (
          <>
            <dt className="text-[var(--color-label-secondary)]">Ret / avg DD</dt>
            <dd className="font-medium col-span-1 sm:col-span-2">
              {String(m.return_over_avg_dd)}
            </dd>
          </>
        )}
        {m.sortino_proxy != null && (
          <>
            <dt className="text-[var(--color-label-secondary)]">Sortino (proxy)</dt>
            <dd className="font-medium col-span-1 sm:col-span-2">
              {String(m.sortino_proxy)}
            </dd>
          </>
        )}
      </dl>
      {Array.isArray(m.folds) && (
        <ul className="mt-2 space-y-0.5 border-t border-[var(--color-separator)] pt-1 text-[0.65rem]">
          {(m.folds as Array<Record<string, unknown>>).map((f, i) => (
            <li key={i} className="tabular-nums text-[var(--color-label-secondary)]">
              Fold {String(f.fold)}: {String(f.test)} · {String(f.trades)} trades · DD $
              {String(f.max_drawdown_dollars)}
            </li>
          ))}
        </ul>
      )}
      {prov?.source === "stub" && (
        <p className="mt-2 text-[0.65rem] text-amber-800 dark:text-amber-200">
          Data proxy: {prov.label || "stub — not live market"}
        </p>
      )}
      {entry.at && (
        <p className="mt-1 font-mono text-[0.6rem] text-[var(--color-label-secondary)]">
          {entry.at}
        </p>
      )}
    </div>
  );
}

export default function DevelopmentValidation({ strategy, onUpdated }: Props) {
  const [status, setStatus] = useState<StrategyValidationStatus | null>(null);
  const [busy, setBusy] = useState<"backtest" | "walk" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const v = await fetchValidation(strategy.id);
    setStatus(v);
  }, [strategy.id]);

  useEffect(() => {
    void reload();
  }, [reload, strategy.updated_at, strategy.phase_state]);

  const bag = status?.validation || {};
  const btOk =
    bag.backtest?.status === "pass" || bag.backtest?.status === "completed";
  const fwOk =
    bag.forward_walk?.status === "pass" ||
    bag.forward_walk?.status === "completed";

  return (
    <div
      className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-3"
      data-testid="development-validation"
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            Design validation
          </h3>
          <p className="mt-0.5 text-[0.7rem] leading-snug text-[var(--color-label-secondary)]">
            Back test and forward walk settings <strong>here</strong> before Curate
            (paper / live prep). Curate is not where you first prove the edge.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <StatusPill ok={btOk ? true : bag.backtest ? false : null} label="Back test" />
          <StatusPill
            ok={fwOk ? true : bag.forward_walk ? false : null}
            label="Forward walk"
          />
          <StatusPill
            ok={status?.ready_for_curation ?? null}
            label={status?.ready_for_curation ? "Ready for Curate" : "Not ready"}
          />
        </div>
      </div>

      <ol className="mb-3 list-decimal space-y-0.5 pl-4 text-[0.7rem] text-[var(--color-label-secondary)]">
        <li>Configure pack (designer above)</li>
        <li>
          <strong>Back test</strong> — in-sample check of settings (→ phase state Back
          test)
        </li>
        <li>
          <strong>Forward walk</strong> — rolling holdouts (→ Deployed when pass)
        </li>
        <li>Promote to Curate for live sim / market prep</li>
      </ol>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          onClick={async () => {
            setBusy("backtest");
            setError(null);
            const res = await runBacktest(strategy.id);
            setBusy(null);
            if (res.error) setError(res.error);
            else {
              await reload();
              onUpdated?.();
            }
          }}
        >
          {busy === "backtest" ? "Running…" : "Run back test"}
        </button>
        <button
          type="button"
          disabled={busy !== null || !btOk}
          className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-fill)] disabled:opacity-40"
          title={!btOk ? "Complete back test first" : undefined}
          onClick={async () => {
            setBusy("walk");
            setError(null);
            const res = await runForwardWalk(strategy.id);
            setBusy(null);
            if (res.error) setError(res.error);
            else {
              await reload();
              onUpdated?.();
            }
          }}
        >
          {busy === "walk" ? "Running…" : "Run forward walk"}
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {(status?.gaps?.length ?? 0) > 0 && (
        <p className="mb-2 text-[0.7rem] text-amber-800 dark:text-amber-200">
          Before Curate: {status!.gaps.join(" · ")}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <MetricsBlock title="Back test (IS)" entry={bag.backtest} />
        <MetricsBlock title="Forward walk" entry={bag.forward_walk} />
      </div>
    </div>
  );
}
