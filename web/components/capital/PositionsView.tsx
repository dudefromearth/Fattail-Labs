"use client";

/**
 * Cross-account Positions view — Spec v0.2 surface two.
 * Chip filters: accounts · asset class · campaign · Undirected.
 *
 * Hardening C6: when under Practice chrome, account + campaign follow suite
 * scope (same book as Trade Log / Reports). Asset class + Undirected stay local.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PositionsValuationTable from "@/components/capital/PositionsValuationTable";
import {
  fetchPositionsValuation,
  formatMarksAsOf,
  marksAgeIsStale,
  type PositionsValuation,
} from "@/lib/capitalApi";
import { usePracticeContextOptional } from "@/lib/practiceContext";

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
  const practice = usePracticeContextOptional();
  const [data, setData] = useState<PositionsValuation | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Local fallback when rendered outside Practice chrome. */
  const [localAccountId, setLocalAccountId] = useState<number | null>(null);
  const [localCampaignId, setLocalCampaignId] = useState<number | null>(null);
  const [undirected, setUndirected] = useState(false);
  const [assetClass, setAssetClass] = useState<string | null>(null);

  const accountId =
    practice != null ? practice.accountIdParam : localAccountId;
  const campaignId =
    practice != null ? practice.campaignId : localCampaignId;

  const setAccountId = useCallback(
    (id: number | null) => {
      if (practice) {
        practice.setAccountId(id == null ? "all" : id);
      } else {
        setLocalAccountId(id);
      }
    },
    [practice],
  );

  const setCampaignId = useCallback(
    (id: number | null) => {
      if (practice) {
        practice.setCampaignId(id);
      } else {
        setLocalCampaignId(id);
      }
    },
    [practice],
  );

  const reload = useCallback(async () => {
    if (practice && !practice.prefsReady) return;
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
  }, [accountId, campaignId, undirected, assetClass, practice]);

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
            className={[
              "mt-0.5 text-xs",
              data?.stream_heartbeat_stale ||
              marksAgeIsStale(data?.marks_age_seconds)
                ? "font-medium text-amber-700 dark:text-amber-400"
                : "text-[var(--color-label-tertiary)]",
            ].join(" ")}
            data-testid="positions-marks-as-of"
            data-stale={
              data?.stream_heartbeat_stale ||
              marksAgeIsStale(data?.marks_age_seconds)
                ? "true"
                : "false"
            }
            data-stream-stale={
              data?.stream_heartbeat_stale ? "true" : "false"
            }
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
