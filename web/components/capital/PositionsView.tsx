"use client";

/**
 * Cross-account Positions view — Spec v0.2 surface two.
 * Chip filters: accounts · asset class · campaign · Undirected.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PositionsValuationTable from "@/components/capital/PositionsValuationTable";
import {
  fetchPositionsValuation,
  formatMarksAsOf,
  type PositionsValuation,
} from "@/lib/capitalApi";

type Chip =
  | { kind: "all_accounts" }
  | { kind: "account"; id: number }
  | { kind: "asset"; id: "equities" | "options" }
  | { kind: "campaign"; id: number }
  | { kind: "undirected" };

export default function PositionsView({
  onOpenTrade,
}: {
  onOpenTrade?: (tradeId: number) => void;
}) {
  const [data, setData] = useState<PositionsValuation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [undirected, setUndirected] = useState(false);
  const [assetClass, setAssetClass] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const v = await fetchPositionsValuation({
        accountId,
        campaignId: undirected ? null : campaignId,
        undirected: undirected ? true : null,
        assetClass,
      });
      setData(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [accountId, campaignId, undirected, assetClass]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const accountChips = useMemo(() => {
    if (!data) return [] as { id: number; label: string }[];
    // Prefer groups present; also list campaigns' accounts from totals
    return data.accounts.map((a) => ({
      id: a.account_id,
      label: a.label,
    }));
  }, [data]);

  function chipClass(on: boolean) {
    return [
      "min-h-8 rounded-full px-3 py-1 text-xs font-medium transition-colors",
      on
        ? "bg-[var(--color-tint)] text-[var(--color-on-tint)]"
        : "bg-[var(--color-fill)] text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
    ].join(" ");
  }

  return (
    <div className="space-y-4" data-testid="positions-view">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-label)]">
            Positions
          </h2>
          <p
            className="mt-0.5 text-xs text-[var(--color-label-tertiary)]"
            data-testid="positions-marks-as-of"
          >
            {formatMarksAsOf(data)}
            {" · "}
            <Link
              href="/app/practice/symbols"
              className="font-medium text-[var(--color-tint)] hover:underline"
            >
              Marked underliers
            </Link>
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Position filters"
        data-testid="positions-filter-chips"
      >
        <button
          type="button"
          className={chipClass(accountId == null && !undirected && campaignId == null && !assetClass)}
          onClick={() => {
            setAccountId(null);
            setCampaignId(null);
            setUndirected(false);
            setAssetClass(null);
          }}
        >
          All
        </button>
        {accountChips.map((a) => (
          <button
            key={a.id}
            type="button"
            className={chipClass(accountId === a.id)}
            onClick={() => {
              setAccountId(a.id);
              setUndirected(false);
            }}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          className={chipClass(assetClass === "equities")}
          onClick={() =>
            setAssetClass((c) => (c === "equities" ? null : "equities"))
          }
        >
          Equities
        </button>
        <button
          type="button"
          className={chipClass(assetClass === "options")}
          onClick={() =>
            setAssetClass((c) => (c === "options" ? null : "options"))
          }
        >
          Options
        </button>
        {(data?.campaigns || []).map((c) => (
          <button
            key={c.id}
            type="button"
            className={chipClass(campaignId === c.id && !undirected)}
            onClick={() => {
              setCampaignId(c.id);
              setUndirected(false);
            }}
          >
            {c.title}
          </button>
        ))}
        <button
          type="button"
          className={chipClass(undirected)}
          onClick={() => {
            setUndirected((u) => !u);
            setCampaignId(null);
          }}
          data-testid="filter-undirected"
        >
          Undirected
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <PositionsValuationTable
        data={data}
        variant="full"
        showHeader={false}
        onDirectCampaign={onOpenTrade}
      />
    </div>
  );
}
