"use client";

/**
 * Canonical mid / proxy display for underlier marks.
 * Use on every table that shows live prices (Practice, Admin, Lab, Positions).
 */

import {
  formatDayPct,
  formatUnderlierMid,
  type BoundUnderlierMark,
} from "@/lib/market/liveUnderlierPattern";

export function LiveMid({
  mark,
  digits = 2,
  showAge = false,
  className = "",
}: {
  mark: BoundUnderlierMark | null | undefined;
  digits?: number;
  showAge?: boolean;
  className?: string;
}) {
  const mid = mark?.mid ?? null;
  const live = mid != null && !mark?.viaProxy;
  return (
    <span
      className={[
        "font-mono tabular-nums font-medium",
        live
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-[var(--color-label-tertiary)]",
        className,
      ].join(" ")}
      data-testid={mark ? `live-mid-${mark.symbol}` : undefined}
      data-symbol={mark?.symbol}
      data-via-proxy={mark?.viaProxy ? "1" : "0"}
    >
      {formatUnderlierMid(mid, digits)}
      {showAge && mark?.ageSeconds != null && mid != null ? (
        <span className="ml-1 text-[10px] font-normal opacity-60">
          {Math.round(mark.ageSeconds)}s
        </span>
      ) : null}
    </span>
  );
}

export function LiveProxyMid({
  mark,
  className = "",
}: {
  mark: BoundUnderlierMark | null | undefined;
  className?: string;
}) {
  if (!mark?.viaProxy || mark.proxyMid == null) {
    return (
      <span className={`font-mono text-xs text-[var(--color-label-tertiary)] ${className}`}>
        —
      </span>
    );
  }
  return (
    <span
      className={`font-mono text-xs tabular-nums text-sky-700 dark:text-sky-400 ${className}`}
      title={mark.feedUsed || mark.source || "proxy"}
      data-testid={mark ? `live-proxy-${mark.symbol}` : undefined}
    >
      {formatUnderlierMid(mark.proxyMid)}
      {mark.feedUsed ? ` · ${mark.feedUsed}` : ""}
    </span>
  );
}

export function LiveDayPct({
  mark,
  className = "",
}: {
  mark: BoundUnderlierMark | null | undefined;
  className?: string;
}) {
  const n = mark?.dayChangePct;
  const tone =
    n == null
      ? "text-[var(--color-label-secondary)]"
      : n >= 0
        ? "text-rose-700"
        : "text-emerald-700";
  return (
    <span className={`font-mono tabular-nums ${tone} ${className}`}>
      {formatDayPct(n)}
    </span>
  );
}

export function LiveMarksStatus({
  transport,
  lastHttpAt,
  tick: _tick,
}: {
  transport: string;
  lastHttpAt: number | null;
  tick?: number;
}) {
  const ago =
    lastHttpAt != null
      ? Math.max(0, Math.round((Date.now() - lastHttpAt) / 1000))
      : null;
  return (
    <span
      className="text-xs text-[var(--color-label-tertiary)]"
      data-testid="live-marks-status"
    >
      Stream:{" "}
      <span
        className={
          transport === "stream"
            ? "font-medium text-emerald-600"
            : transport === "http"
              ? "font-medium text-[var(--color-label-secondary)]"
              : "text-[var(--color-label-tertiary)]"
        }
      >
        {transport}
      </span>
      {ago != null ? ` · HTTP ${ago}s ago` : ""}
    </span>
  );
}
