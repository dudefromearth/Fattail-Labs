"use client";

/**
 * Shared underliers table — Practice + Admin + Strategy Lab.
 * All live mid cells go through bindUnderlierMark + LiveMid.
 */

import Link from "next/link";
import {
  LiveDayPct,
  LiveMarksStatus,
  LiveMid,
  LiveProxyMid,
} from "@/components/market/LiveMid";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";
import { formatUnderlierMid } from "@/lib/market/liveUnderlierPattern";

export type LiveUnderliersTableVariant = "practice" | "admin" | "lab";

export default function LiveUnderliersTable({
  variant = "practice",
  enabledOnly = true,
  title,
  description,
  adminHref = "/admin/market-universe",
  showActions,
}: {
  variant?: LiveUnderliersTableVariant;
  enabledOnly?: boolean;
  title?: string;
  description?: React.ReactNode;
  adminHref?: string;
  showActions?: (symbol: string) => React.ReactNode;
}) {
  const { rows, transport, error, lastHttpAt, tick } = useLiveUnderlierMarks({
    enabledOnly,
    pollMs: 5000,
  });

  const isAdmin = variant === "admin";

  return (
    <div
      className="space-y-4"
      data-testid={`live-underliers-table-${variant}`}
    >
      {(title || description) && (
        <header>
          {title ? (
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-label)]">
              {title}
            </h1>
          ) : null}
          {description ? (
            <div className="mt-2 max-w-2xl text-sm text-[var(--color-label-secondary)]">
              {description}
            </div>
          ) : null}
          <p className="mt-1">
            <LiveMarksStatus
              transport={transport}
              lastHttpAt={lastHttpAt}
              tick={tick}
            />
            {variant === "practice" ? (
              <>
                {" · "}
                <Link
                  href={adminHref}
                  className="text-xs font-medium text-[var(--color-tint)] hover:underline"
                >
                  Admin · Market universe
                </Link>
              </>
            ) : null}
          </p>
        </header>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div
        className={[
          "overflow-x-auto rounded-[var(--radius-md)] border",
          isAdmin
            ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            : "border-[var(--color-separator)]",
        ].join(" ")}
      >
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr
              className={[
                "border-b text-[10px] uppercase tracking-wide",
                isAdmin
                  ? "border-zinc-200 text-zinc-500 dark:border-zinc-800"
                  : "border-[var(--color-separator)] text-[var(--color-label-tertiary)]",
              ].join(" ")}
            >
              <th className="px-3 py-2 font-semibold">Symbol</th>
              <th className="px-2 py-2 font-semibold">Kind</th>
              <th className="px-2 py-2 font-semibold">Mid</th>
              <th className="px-2 py-2 font-semibold">Proxy</th>
              <th className="px-2 py-2 font-semibold">Prev</th>
              <th className="px-2 py-2 font-semibold">Day %</th>
              <th className="px-2 py-2 font-semibold">Source</th>
              <th className="px-3 py-2 font-semibold">Note</th>
              {showActions ? (
                <th className="px-3 py-2 font-semibold">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.symbol}
                className={
                  isAdmin
                    ? "border-b border-zinc-100 dark:border-zinc-800"
                    : "border-b border-[var(--color-separator)]/60"
                }
                data-testid={`${variant}-symbol-${s.symbol}`}
                data-symbol={s.symbol}
              >
                <td className="px-3 py-2 font-mono font-semibold text-[var(--color-label)]">
                  {variant === "lab" ? (
                    <Link
                      href={`/app/strategy-lab/symbols/${encodeURIComponent(s.symbol)}`}
                      className="text-blue-700 hover:underline"
                    >
                      {s.symbol}
                    </Link>
                  ) : (
                    s.symbol
                  )}
                </td>
                <td className="px-2 py-2 text-xs capitalize text-[var(--color-label-secondary)]">
                  {s.kind || "—"}
                </td>
                <td className="px-2 py-2">
                  <LiveMid mark={s.mark} showAge={isAdmin} />
                </td>
                <td className="px-2 py-2">
                  <LiveProxyMid mark={s.mark} />
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-label-secondary)]">
                  {formatUnderlierMid(s.mark.prevClose)}
                </td>
                <td className="px-2 py-2">
                  <LiveDayPct mark={s.mark} />
                </td>
                <td className="px-2 py-2 text-[10px] text-[var(--color-label-tertiary)]">
                  {[s.mark.plane, s.mark.source].filter(Boolean).join(" · ") ||
                    "—"}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--color-label-secondary)]">
                  {s.note || "—"}
                </td>
                {showActions ? (
                  <td className="px-3 py-2">{showActions(s.symbol)}</td>
                ) : null}
              </tr>
            ))}
            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={showActions ? 9 : 8}
                  className="px-3 py-8 text-center text-[var(--color-label-tertiary)]"
                >
                  Loading universe…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
