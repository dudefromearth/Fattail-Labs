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
  type PositionValuationRow,
  type PositionsValuation,
} from "@/lib/capitalApi";
import { useSymbolMarks } from "@/lib/market/useSymbolMarks";
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

  // Live refresh — server ensure_fresh + OPF; visibility-aware.
  useEffect(() => {
    if (practice && !practice.prefsReady) return;
    let t: number | null = null;
    const tick = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const start = () => {
      if (t != null) return;
      t = window.setInterval(tick, 3000);
    };
    const stop = () => {
      if (t != null) {
        window.clearInterval(t);
        t = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reload, practice]);

  // Equity underliers → Market Bus stream for snappy Last (overlay)
  const equityUnderliers = useMemo(() => {
    if (!data) return [] as string[];
    const s = new Set<string>();
    for (const a of data.accounts) {
      for (const p of a.positions) {
        if ((p.asset_class || "").toLowerCase() === "equity" && p.underlier) {
          s.add(p.underlier.toUpperCase());
        }
      }
    }
    return [...s];
  }, [data]);

  const { marks: liveMarks, transport: marksTransport } = useSymbolMarks({
    symbols: equityUnderliers,
    enabled: equityUnderliers.length > 0,
  });

  /** Merge live mids into equity rows so Last/Value/Unrealized move with the bus. */
  const liveData = useMemo((): PositionsValuation | null => {
    if (!data) return null;
    if (!liveMarks.size) return data;
    const accounts = data.accounts.map((acct) => {
      const positions = acct.positions.map((p): PositionValuationRow => {
        if ((p.asset_class || "").toLowerCase() !== "equity" || !p.underlier) {
          return p;
        }
        const live = liveMarks.get(p.underlier.toUpperCase());
        if (live?.mid == null || !Number.isFinite(live.mid)) return p;
        const mid = live.mid;
        const qty = Math.abs(Number(p.qty) || 0);
        const value = mid * qty;
        const cost = p.cost_basis;
        const unrealized =
          cost != null && Number.isFinite(cost) ? value - Number(cost) : p.unrealized;
        return {
          ...p,
          last: mid,
          value,
          unrealized,
          value_label: "underlier_mark",
          degraded: false,
          mark_meta: {
            ...(p.mark_meta || {}),
            engine: "underlier",
            plane: live.plane || "mb:sym",
            source: live.source,
            live_overlay: true,
          },
        };
      });
      const pos_value = positions.reduce(
        (s, r) => s + (r.value != null ? Number(r.value) : 0),
        0,
      );
      const pos_u = positions.reduce(
        (s, r) => s + (r.unrealized != null ? Number(r.unrealized) : 0),
        0,
      );
      for (const r of positions) {
        r.pct_acct =
          r.value != null && pos_value
            ? (Number(r.value) / pos_value) * 100
            : r.pct_acct;
      }
      return {
        ...acct,
        positions,
        totals: {
          ...acct.totals,
          value: pos_value,
          unrealized: pos_u,
        },
      };
    });
    const grand_value = accounts.reduce((s, a) => s + Number(a.totals.value || 0), 0);
    const grand_u = accounts.reduce(
      (s, a) => s + Number(a.totals.unrealized || 0),
      0,
    );
    return {
      ...data,
      accounts,
      marks_plane: data.marks_plane || "market_bus_v1",
      grand_total: {
        ...data.grand_total,
        value: grand_value,
        unrealized: grand_u,
      },
    };
  }, [data, liveMarks]);

  const accountChips = useMemo(() => {
    if (!liveData) return [] as { id: number; label: string }[];
    return liveData.accounts.map((a) => ({
      id: a.account_id,
      label: a.label,
    }));
  }, [liveData]);

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
              liveData?.stream_heartbeat_stale ||
              marksAgeIsStale(liveData?.marks_age_seconds)
                ? "font-medium text-amber-700 dark:text-amber-400"
                : "text-[var(--color-label-tertiary)]",
            ].join(" ")}
            data-testid="positions-marks-as-of"
            data-stale={
              liveData?.stream_heartbeat_stale ||
              marksAgeIsStale(liveData?.marks_age_seconds)
                ? "true"
                : "false"
            }
            data-stream-stale={
              liveData?.stream_heartbeat_stale ? "true" : "false"
            }
          >
            {formatMarksAsOf(liveData)}
            {equityUnderliers.length > 0
              ? ` · marks ${marksTransport}`
              : ""}
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
        {(liveData?.campaigns || []).map((c) => (
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
        data={liveData}
        variant="full"
        showHeader={false}
        onDirectCampaign={onOpenTrade}
      />
    </div>
  );
}
