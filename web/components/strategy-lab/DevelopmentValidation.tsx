"use client";

/**
 * Design-phase gate: Back test (IS) → Forward walk.
 * Neutral HIG cards. Stats left, graphic right. Empty values until run.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
  pushNotice?: (
    level: "info" | "success" | "warning" | "error",
    msg: string,
  ) => void;
};

const btnClass =
  "rounded-[var(--radius-full)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1 text-[var(--text-caption)] font-medium text-[var(--color-label)] shadow-[var(--elevation-1)] disabled:opacity-40";

const TEST_CARD =
  "flex h-[16rem] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]";

const STATS = [
  { key: "trades", label: "Trades", money: false },
  { key: "max_drawdown_dollars", label: "Max DD", money: true },
  { key: "net_pnl_dollars", label: "Net P&L", money: true },
  { key: "return_over_avg_dd", label: "Ret / avg DD", money: false },
  { key: "sortino_proxy", label: "Sortino", money: false },
] as const;

function fmt(raw: unknown, money: boolean): string {
  if (raw == null || raw === "") return "—";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  return money ? `$${n.toFixed(0)}` : String(n);
}

function DistributionCurve({
  live,
  running,
}: {
  live: boolean;
  running: boolean;
}) {
  const bins = useMemo(() => {
    if (!live) return Array.from({ length: 13 }, () => 0.08);
    return [0.08, 0.12, 0.18, 0.28, 0.42, 0.62, 0.88, 0.7, 0.48, 0.3, 0.18, 0.12, 0.16];
  }, [live]);
  const w = 220;
  const h = 110;
  const pad = 8;
  const bw = (w - pad * 2) / bins.length;
  const pts = bins
    .map((v, i) => {
      const x = pad + i * bw + bw / 2;
      const y = h - pad - v * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-full w-full"
      aria-hidden
    >
      <line
        x1={pad}
        y1={h - pad}
        x2={w - pad}
        y2={h - pad}
        stroke="var(--color-separator)"
        strokeWidth="1"
      />
      {bins.map((v, i) => (
        <rect
          key={i}
          x={pad + i * bw + 1}
          y={h - pad - v * (h - pad * 2)}
          width={Math.max(2, bw - 2)}
          height={v * (h - pad * 2)}
          fill="var(--color-fill)"
          opacity={live ? 0.85 : 0.35}
        />
      ))}
      <polyline
        points={pts}
        fill="none"
        stroke="var(--color-label)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity={live ? 0.9 : 0.25}
        className={running ? "origin-center animate-pulse" : undefined}
      />
      {running ? (
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="var(--color-label)"
          strokeWidth="1"
          opacity="0.45"
        >
          <animate
            attributeName="x1"
            values={`${pad};${w - pad};${pad}`}
            dur="1.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values={`${pad};${w - pad};${pad}`}
            dur="1.6s"
            repeatCount="indefinite"
          />
        </line>
      ) : null}
      <text
        x={w / 2}
        y={12}
        textAnchor="middle"
        fill="var(--color-label-tertiary)"
        fontSize="9"
        fontFamily="var(--font-ui)"
      >
        {live ? "MC distribution" : "MC distribution"}
      </text>
    </svg>
  );
}

function FlyWireframe({
  live,
  running,
}: {
  live: boolean;
  running: boolean;
}) {
  const op = live ? 0.9 : 0.35;
  return (
    <svg viewBox="0 0 220 110" className="h-full w-full" aria-hidden>
      <g
        stroke="var(--color-label)"
        strokeWidth="1.1"
        fill="none"
        opacity={op}
        strokeLinejoin="round"
      >
        <path d="M20 88 L70 88 L110 28 L150 88 L200 88" />
        <path d="M40 72 L80 72 L110 40 L140 72 L180 72" />
        <path d="M20 88 L40 72 M70 88 L80 72 M110 28 L110 40 M150 88 L140 72 M200 88 L180 72" />
        <path d="M70 88 L110 28 L150 88" />
      </g>
      <line
        x1="20"
        y1="96"
        x2="200"
        y2="96"
        stroke="var(--color-separator)"
        strokeWidth="1"
      />
      {running ? (
        <polygon
          points="108,22 112,22 118,96 102,96"
          fill="var(--color-fill)"
          opacity="0.55"
        >
          <animate
            attributeName="points"
            values="48,22 52,22 62,96 38,96;168,22 172,22 182,96 158,96;48,22 52,22 62,96 38,96"
            dur="2s"
            repeatCount="indefinite"
          />
        </polygon>
      ) : null}
      <text
        x="110"
        y="12"
        textAnchor="middle"
        fill="var(--color-label-tertiary)"
        fontSize="9"
        fontFamily="var(--font-ui)"
      >
        Structure
      </text>
    </svg>
  );
}

function MetricsBlock({
  title,
  entry,
  action,
  graphic,
  running,
}: {
  title: string;
  entry?: ValidationResultEntry;
  action: React.ReactNode;
  graphic: "distribution" | "wireframe";
  running: boolean;
}) {
  const m = entry?.metrics || {};
  const live = !!(entry && (entry.status === "pass" || entry.status === "completed" || entry.status === "fail"));
  return (
    <div className={`${TEST_CARD} px-3 py-2 text-[var(--text-caption)]`}>
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
        <span className="text-[var(--text-footnote)] font-semibold text-[var(--color-label)]">
          {title}
        </span>
        {action}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(7.25rem,38%)_minmax(0,1fr)] gap-3">
        <dl className="grid content-start grid-cols-[1fr_auto] gap-x-2 gap-y-1 tabular-nums">
          {STATS.map((s) => (
            <span key={s.key} className="contents">
              <dt className="text-[var(--color-label-secondary)]">{s.label}</dt>
              <dd className="text-right font-medium text-[var(--color-label)]">
                {fmt(m[s.key], s.money)}
              </dd>
            </span>
          ))}
        </dl>
        <div className="min-h-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]">
          {graphic === "distribution" ? (
            <DistributionCurve live={live} running={running} />
          ) : (
            <FlyWireframe live={live} running={running} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DevelopmentValidation({
  strategy,
  onUpdated,
  pushNotice,
}: Props) {
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

  return (
    <div className="space-y-2" data-testid="development-validation">
      {error && (
        <p className="text-[var(--text-caption)] text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricsBlock
          title="Back test"
          entry={bag.backtest}
          graphic="distribution"
          running={busy === "backtest"}
          action={
            <button
              type="button"
              disabled={busy !== null}
              className={btnClass}
              onClick={async () => {
                setBusy("backtest");
                setError(null);
                const res = await runBacktest(strategy.id);
                setBusy(null);
                if (res.error) {
                  setError(res.error);
                  pushNotice?.("error", res.error);
                } else {
                  pushNotice?.(
                    "success",
                    res.result?.status === "fail"
                      ? "Back test finished — did not pass."
                      : "Back test finished.",
                  );
                  await reload();
                  onUpdated?.();
                }
              }}
            >
              {busy === "backtest" ? "Running…" : "Run"}
            </button>
          }
        />
        <MetricsBlock
          title="Forward walk"
          entry={bag.forward_walk}
          graphic="wireframe"
          running={busy === "walk"}
          action={
            <button
              type="button"
              disabled={busy !== null || !btOk}
              className={btnClass}
              title={!btOk ? "Run back test first" : undefined}
              onClick={async () => {
                setBusy("walk");
                setError(null);
                const res = await runForwardWalk(strategy.id);
                setBusy(null);
                if (res.error) {
                  setError(res.error);
                  pushNotice?.("error", res.error);
                } else {
                  pushNotice?.(
                    "success",
                    res.result?.status === "fail"
                      ? "Forward walk finished — did not pass."
                      : "Forward walk finished.",
                  );
                  await reload();
                  onUpdated?.();
                }
              }}
            >
              {busy === "walk" ? "Running…" : "Run"}
            </button>
          }
        />
      </div>
    </div>
  );
}
