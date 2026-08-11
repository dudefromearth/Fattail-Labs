/**
 * Live OPF risk graph for Options Lab Analyzer.
 * Hydrates dual-side chain generations per leg expiration → resolve day_trade.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  pollChainLadder,
  type LadderFull,
} from "@/lib/chainLadderApi";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import {
  findBreakevens,
  ladderToOpfGeneration,
  opfCurveToPnLPoints,
  resolveOpfPricing,
  tradeToOpfStrategy,
  type OpfResolveResult,
} from "@/lib/options-lab/opfPricingApi";

export type OpfRiskGraphState = {
  loading: boolean;
  error: string | null;
  result: OpfResolveResult | null;
  spot: number | null;
  expirationPoints: { price: number; pnl: number }[];
  theoreticalPoints: { price: number; pnl: number }[];
  expirationBreakevens: number[];
  theoreticalBreakevens: number[];
  allStrikes: number[];
  maxPnL: number;
  minPnL: number;
  theoreticalPnLAtSpot: number;
  packageDebit: number | null;
  reconPass: boolean | null;
  packId: string | null;
  engineId: string | null;
  refresh: () => void;
};

const WINGS = 50;
const POLL_MS = 2500;

function uniqueExpirations(trade: ParsedTosTrade): string[] {
  const s = new Set<string>();
  for (const l of trade.legs) s.add(l.expiration);
  if (trade.expiration) s.add(trade.expiration);
  return [...s];
}

export function useOpfRiskGraph(opts: {
  trade: ParsedTosTrade | null;
  /** Manual spot override; null → use chain spot */
  spotOverride?: number | null;
  vix?: number | null;
  /** OPF use case + pack (data model) */
  useCase?: "day_trade" | "outlook" | "backtest";
  packId?: string | null;
  /** what-if */
  timeOffsetHours?: number;
  volOffsetPts?: number;
  spotPct?: number;
  /** When false, pause polling */
  enabled?: boolean;
}): OpfRiskGraphState {
  const {
    trade,
    spotOverride = null,
    vix = null,
    useCase = "day_trade",
    packId = null,
    timeOffsetHours = 0,
    volOffsetPts = 0,
    spotPct = 0,
    enabled = true,
  } = opts;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OpfResolveResult | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const laddersRef = useRef<Map<string, LadderFull>>(new Map());
  const tickRef = useRef(0);

  const run = useCallback(async () => {
    if (!trade || !enabled) {
      setResult(null);
      setError(null);
      return;
    }
    const tick = ++tickRef.current;
    setLoading(true);
    try {
      const exps = uniqueExpirations(trade);
      const gens = [];
      let chainSpot: number | null = null;
      let chainVix: number | null = vix;

      for (const exp of exps) {
        const prev = laddersRef.current.get(exp);
        const polled = await pollChainLadder({
          expiration: exp,
          symbol: trade.symbol,
          wings: WINGS,
          since_hash: prev?.content_hash ?? null,
        });
        let ladder: LadderFull | null = prev ?? null;
        if (polled.mode === "full") {
          ladder = polled.ladder;
          laddersRef.current.set(exp, ladder);
        } else if (polled.mode === "diff" && prev) {
          // Apply upserts
          const byKey = new Map(
            prev.rows.map((r) => [
              `${(r.side || "call").toLowerCase()}:${r.strike}`,
              r,
            ]),
          );
          for (const u of polled.upserts || []) {
            byKey.set(
              `${(u.side || "call").toLowerCase()}:${u.strike}`,
              u,
            );
          }
          for (const rem of polled.removes || []) {
            byKey.delete(String(rem));
          }
          ladder = {
            ...prev,
            content_hash: polled.content_hash,
            as_of: polled.as_of,
            spot: polled.spot ?? prev.spot,
            rows: [...byKey.values()],
          };
          laddersRef.current.set(exp, ladder);
        } else if (polled.mode === "unchanged" && prev) {
          ladder = prev;
        } else if (!ladder) {
          // force full
          const full = await pollChainLadder({
            expiration: exp,
            symbol: trade.symbol,
            wings: WINGS,
          });
          if (full.mode === "full") {
            ladder = full.ladder;
            laddersRef.current.set(exp, ladder);
          }
        }
        if (!ladder) {
          throw new Error(`No chain generation for ${trade.symbol} ${exp}`);
        }
        if (chainSpot == null && ladder.spot > 0) chainSpot = ladder.spot;
        if (ladder.vix != null) chainVix = ladder.vix;
        gens.push(ladderToOpfGeneration(ladder, trade.symbol, WINGS));
      }

      const spotUse =
        spotOverride != null && spotOverride > 0
          ? spotOverride
          : chainSpot;
      if (spotUse == null || !(spotUse > 0)) {
        throw new Error("No spot from chain or override");
      }

      const resolved = await resolveOpfPricing({
        use_case: useCase,
        pack_id: packId,
        strategy: tradeToOpfStrategy(trade),
        generations: gens,
        spot: spotUse,
        vix: chainVix,
        what_if: {
          spot_pct: spotPct,
          vol_offset_pts: volOffsetPts,
          time_offset_hours: timeOffsetHours,
          curve_steps: 161,
          curve_range_pct: 8,
        },
        scenario:
          useCase === "outlook"
            ? {
                vol_offset_pts: volOffsetPts,
                time_offset_hours: timeOffsetHours,
                spot_pct: spotPct,
              }
            : undefined,
      });

      if (tick !== tickRef.current) return;
      setSpot(spotUse);
      setResult(resolved);
      setError(
        resolved.meta?.error
          ? String(resolved.meta.error)
          : resolved.complete === false && !resolved.curves?.model_t0?.points
            ? "OPF resolve incomplete"
            : null,
      );
    } catch (e) {
      if (tick !== tickRef.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      if (tick === tickRef.current) setLoading(false);
    }
  }, [
    trade,
    enabled,
    spotOverride,
    vix,
    useCase,
    packId,
    timeOffsetHours,
    volOffsetPts,
    spotPct,
  ]);

  useEffect(() => {
    void run();
    if (!trade || !enabled) return;
    const id = window.setInterval(() => void run(), POLL_MS);
    return () => window.clearInterval(id);
  }, [run, trade, enabled]);

  /**
   * ToS Risk Analyzer uses the order limit as cost basis when present.
   * OPF marks use natural mid; shift curves so basis = limit (debit positive).
   */
  const basisShift = useMemo(() => {
    if (!trade?.limit || trade.limit <= 0) return 0;
    const dNat = result?.marks?.package_debit_per_share;
    if (dNat == null || !Number.isFinite(dNat)) return 0;
    const limitSigned = trade.isCredit
      ? -Math.abs(trade.limit)
      : Math.abs(trade.limit);
    // pnl uses (V - basis)*100; shifting basis D→L adds (D-L)*100
    return (dNat - limitSigned) * 100;
  }, [trade, result]);

  const expirationPoints = useMemo(() => {
    const pts = opfCurveToPnLPoints(result?.curves?.expiration?.points);
    if (!basisShift) return pts;
    return pts.map((p) => ({ price: p.price, pnl: p.pnl + basisShift }));
  }, [result, basisShift]);
  const theoreticalPoints = useMemo(() => {
    const pts = opfCurveToPnLPoints(result?.curves?.model_t0?.points);
    if (!basisShift) return pts;
    return pts.map((p) => ({ price: p.price, pnl: p.pnl + basisShift }));
  }, [result, basisShift]);

  const allStrikes = useMemo(
    () => (trade ? trade.legs.map((l) => l.strike) : []),
    [trade],
  );

  const { maxPnL, minPnL, theoreticalPnLAtSpot } = useMemo(() => {
    let max = -Infinity;
    let min = Infinity;
    for (const p of theoreticalPoints) {
      if (p.pnl > max) max = p.pnl;
      if (p.pnl < min) min = p.pnl;
    }
    for (const p of expirationPoints) {
      if (p.pnl > max) max = p.pnl;
      if (p.pnl < min) min = p.pnl;
    }
    if (!Number.isFinite(max)) max = 0;
    if (!Number.isFinite(min)) min = 0;
    let atSpot = result?.model_t0?.pnl_dollars ?? 0;
    if (spot != null && theoreticalPoints.length) {
      // nearest grid
      let best = theoreticalPoints[0];
      let bestD = Math.abs(best.price - spot);
      for (const p of theoreticalPoints) {
        const d = Math.abs(p.price - spot);
        if (d < bestD) {
          best = p;
          bestD = d;
        }
      }
      atSpot = best.pnl;
    }
    return { maxPnL: max, minPnL: min, theoreticalPnLAtSpot: atSpot };
  }, [theoreticalPoints, expirationPoints, result, spot]);

  return {
    loading,
    error,
    result,
    spot,
    expirationPoints,
    theoreticalPoints,
    expirationBreakevens: findBreakevens(expirationPoints),
    theoreticalBreakevens: findBreakevens(theoreticalPoints),
    allStrikes,
    maxPnL,
    minPnL,
    theoreticalPnLAtSpot,
    packageDebit: result?.marks?.package_debit_per_share ?? null,
    reconPass: result?.meta?.recon?.pass ?? null,
    packId: result?.pack_id ?? null,
    engineId: result?.meta?.engine_id ?? result?.model_t0?.engine_id ?? null,
    refresh: () => void run(),
  };
}
