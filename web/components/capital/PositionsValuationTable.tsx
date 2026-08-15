"use client";

/**
 * Shared position-row table — Positions View Spec v0.2
 * compact (Accounts & Capital embed) vs full (Positions mode).
 * No valence color. Undirected = no campaign chip.
 */

import Link from "next/link";
import CampaignBadge from "@/components/practice/CampaignBadge";
import type { PositionValuationRow, PositionsValuation } from "@/lib/capitalApi";
import { formatMarksAsOf } from "@/lib/capitalApi";

function money(
  n: number | null | undefined,
  opts?: { signed?: boolean; digits?: number },
): string {
  if (n == null || Number.isNaN(n)) return "—";
  const digits = opts?.digits ?? 2;
  const s = n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (opts?.signed && n > 0) return `+${s}`;
  return s;
}

function num(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export default function PositionsValuationTable({
  data,
  variant = "full",
  accountIdFilter,
  showHeader = true,
  onDirectCampaign,
}: {
  data: PositionsValuation | null;
  variant?: "compact" | "full";
  /** When set, only that account group (embed). */
  accountIdFilter?: number | null;
  showHeader?: boolean;
  onDirectCampaign?: (tradeId: number) => void;
}) {
  if (!data) {
    return (
      <p className="text-sm text-[var(--color-label-tertiary)]">Loading positions…</p>
    );
  }

  const groups = accountIdFilter
    ? data.accounts.filter((a) => a.account_id === accountIdFilter)
    : data.accounts;

  const multiBookSymbols = (() => {
    const counts = new Map<string, Set<number>>();
    for (const g of data.accounts) {
      for (const p of g.positions) {
        const u = p.underlier || p.symbol;
        if (!counts.has(u)) counts.set(u, new Set());
        counts.get(u)!.add(g.account_id);
      }
    }
    return [...counts.entries()]
      .filter(([, s]) => s.size > 1)
      .map(([u]) => u);
  })();

  return (
    <div className="space-y-4" data-testid="positions-valuation-table">
      {showHeader && (
        <p
          className="text-right text-xs text-[var(--color-label-tertiary)]"
          data-testid="marks-as-of"
        >
          {formatMarksAsOf(data)}
          <span className="ml-2">· declared figures vary by row</span>
        </p>
      )}

      {groups.length === 0 && (
        <p className="text-sm text-[var(--color-label-secondary)]">
          No open positions in this view.
        </p>
      )}

      {groups.map((g) => (
        <section
          key={g.account_id}
          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-separator)]"
          data-testid={`positions-account-${g.account_id}`}
        >
          {!accountIdFilter && (
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-2">
              <span className="text-sm font-semibold text-[var(--color-label)]">
                {g.label}
                {g.broker ? (
                  <span className="ml-2 text-xs font-normal text-[var(--color-label-tertiary)]">
                    {g.broker}
                  </span>
                ) : null}
              </span>
              <span className="text-sm tabular-nums text-[var(--color-label)]">
                {money(g.totals.value)}
              </span>
            </header>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-separator)] text-[var(--color-label-tertiary)]">
                  <th className="px-3 py-1.5 font-medium">Symbol</th>
                  <th className="px-2 py-1.5 font-medium tabular-nums">Last</th>
                  <th className="px-2 py-1.5 font-medium tabular-nums">Day</th>
                  {variant === "full" && (
                    <th className="px-2 py-1.5 font-medium tabular-nums">Day G/L</th>
                  )}
                  <th className="px-2 py-1.5 font-medium tabular-nums">Value</th>
                  <th className="px-2 py-1.5 font-medium tabular-nums">% acct</th>
                  <th className="px-2 py-1.5 font-medium tabular-nums">Qty</th>
                  <th className="px-2 py-1.5 font-medium tabular-nums">
                    {variant === "full" ? "Cost basis" : "Avg cost"}
                  </th>
                  <th className="px-3 py-1.5 font-medium tabular-nums">Unrealized</th>
                </tr>
              </thead>
              <tbody>
                {g.positions.map((p) => (
                  <PositionRow
                    key={p.trade_id}
                    p={p}
                    variant={variant}
                    onDirectCampaign={onDirectCampaign}
                  />
                ))}
                {variant === "full" && (
                  <tr className="border-t border-[var(--color-separator)] bg-[var(--color-fill)]/60 font-medium text-[var(--color-label)]">
                    <td className="px-3 py-2" colSpan={3}>
                      Account total
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {money(g.totals.day_gl, { signed: true })}
                    </td>
                    <td className="px-2 py-2 tabular-nums">{money(g.totals.value)}</td>
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2" />
                    <td className="px-3 py-2 tabular-nums">
                      {money(g.totals.unrealized, { signed: true })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {g.positions.some((p) => p.degraded) && (
            <p className="border-t border-[var(--color-separator)] px-3 py-1.5 text-[10px] text-[var(--color-label-tertiary)]">
              Some symbols show value at cost — no usable mark (universe or options
              chain). Not closed-market age.{" "}
              <Link
                href="/app/practice/symbols"
                className="font-medium text-[var(--color-tint)] hover:underline"
              >
                Marked underliers →
              </Link>
            </p>
          )}
        </section>
      ))}

      {variant === "full" && groups.length > 0 && !accountIdFilter && (
        <div
          className="flex flex-wrap justify-between gap-2 border-t-2 border-[var(--color-label)] pt-3 text-sm font-semibold text-[var(--color-label)]"
          data-testid="positions-grand-total"
        >
          <span>All accounts</span>
          <span className="tabular-nums space-x-4">
            <span>Day G/L {money(data.grand_total.day_gl, { signed: true })}</span>
            <span>Value {money(data.grand_total.value)}</span>
            <span>
              Unrealized {money(data.grand_total.unrealized, { signed: true })}
            </span>
          </span>
        </div>
      )}

      {multiBookSymbols.length > 0 && (
        <p className="text-[10px] text-[var(--color-label-tertiary)]">
          {multiBookSymbols.slice(0, 5).join(", ")}
          {multiBookSymbols.length > 5 ? "…" : ""} held in multiple accounts —
          shown per book, never netted.
        </p>
      )}

      <p className="text-[10px] text-[var(--color-label-tertiary)]">
        A position shows one campaign chip when its trade is directed — and nothing
        at all when it isn&apos;t. Undirected is a lawful resting state.{" "}
        <Link
          href="/app/practice/symbols"
          className="font-medium text-[var(--color-tint)] hover:underline"
          data-testid="link-marked-underliers"
        >
          Marked underliers
        </Link>{" "}
        · underliers Labs can price.
      </p>
    </div>
  );
}

function PositionRow({
  p,
  variant,
  onDirectCampaign,
}: {
  p: PositionValuationRow;
  variant: "compact" | "full";
  onDirectCampaign?: (tradeId: number) => void;
}) {
  return (
    <tr
      className="border-b border-[var(--color-separator)]/60 text-[var(--color-label)]"
      data-testid={`position-row-${p.trade_id}`}
    >
      <td className="px-3 py-1.5">
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{p.symbol}</span>
          {/* V9: directed only — undirected is absence */}
          {p.campaign && (
            <CampaignBadge
              title={
                p.campaign.title.length > 16
                  ? `${p.campaign.title.slice(0, 14)}…`
                  : p.campaign.title
              }
              color={p.campaign.badge_color}
              titleAttr="Campaign · tap to redirect"
              testId="position-campaign-chip"
              onClick={() => onDirectCampaign?.(p.trade_id)}
            />
          )}
          {p.value_label === "at_cost" && (
            <span className="text-[10px] text-[var(--color-label-tertiary)]">
              at cost
            </span>
          )}
        </span>
      </td>
      <td className="px-2 py-1.5 tabular-nums">{num(p.last)}</td>
      <td className="px-2 py-1.5 tabular-nums">{num(p.day)}</td>
      {variant === "full" && (
        <td className="px-2 py-1.5 tabular-nums">
          {money(p.day_gl, { signed: true })}
        </td>
      )}
      <td className="px-2 py-1.5 tabular-nums">{money(p.value)}</td>
      <td className="px-2 py-1.5 tabular-nums">
        {p.pct_acct != null ? `${num(p.pct_acct, 1)}%` : "—"}
      </td>
      <td className="px-2 py-1.5 tabular-nums">{num(p.qty, 0)}</td>
      <td className="px-2 py-1.5 tabular-nums">
        {variant === "full" ? money(p.cost_basis) : num(p.avg_cost)}
      </td>
      <td className="px-3 py-1.5 tabular-nums">
        {money(p.unrealized, { signed: true })}
      </td>
    </tr>
  );
}
