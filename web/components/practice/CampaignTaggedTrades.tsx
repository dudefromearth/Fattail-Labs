"use client";

/**
 * Campaign view — only trades that wear this campaign badge.
 * Search and badge live on Campaigns → Find and Badge.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchTrades } from "@/lib/tradeLogApi";
import type { Trade } from "@/lib/tradeLog";
import type { PracticeCampaign } from "@/lib/practiceSpineApi";

function dayYmd(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = String(iso);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "—";
}

function symbolOf(t: Trade): string {
  const legs = t.legs || [];
  return String(
    legs.find((l) => l.underlier)?.underlier ||
      legs.find((l) => l.symbol)?.symbol ||
      "—",
  );
}

export default function CampaignTaggedTrades({
  campaign,
}: {
  campaign: PracticeCampaign;
}) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTrades(null, {
      limit: 80,
      practice_campaign_id: campaign.id,
    })
      .then((res) => {
        if (cancelled) return;
        setTrades(res.ok ? res.data.trades || [] : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaign.id]);

  return (
    <section
      className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 sm:p-5"
      data-testid="campaign-tagged-trades"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className="font-semibold text-[var(--color-label)]"
          style={{ fontSize: "var(--text-headline)" }}
        >
          Trades in this campaign
        </h2>
        <Link
          href="/app/practice/campaign#find-badge"
          className="text-xs font-medium text-[var(--color-tint)] hover:underline"
        >
          Find and Badge
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
        Only fills wearing this campaign badge. Search and retag happen on the
        Campaigns page.
      </p>
      <div className="mt-3 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
        ) : trades.length === 0 ? (
          <p className="text-sm text-[var(--color-label-tertiary)]">
            No trades tagged with this campaign.
          </p>
        ) : (
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
                <th className="py-1.5 font-medium">When</th>
                <th className="py-1.5 font-medium">Symbol</th>
                <th className="py-1.5 font-medium">Strategy</th>
                <th className="py-1.5 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-[var(--color-separator)]"
                >
                  <td className="py-2 tabular-nums text-[var(--color-label-secondary)]">
                    {dayYmd(t.exec_at)}
                  </td>
                  <td className="py-2 text-[var(--color-label)]">
                    {symbolOf(t)}
                  </td>
                  <td className="py-2 text-[var(--color-label-secondary)]">
                    {t.strategy}
                  </td>
                  <td className="py-2 tabular-nums text-[var(--color-label)]">
                    {t.pnl_amount == null
                      ? "—"
                      : t.pnl_amount.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
