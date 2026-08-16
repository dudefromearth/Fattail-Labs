/**
 * Live OPF risk graph for Options Lab Analyzer.
 * Hydrates dual-side chain generations per leg expiration → resolve day_trade.
 *
 * Suite keep-warm: results + ladder generations live in a module cache so
 * Heatmap ↔ Analyzer route switches re-paint instantly instead of blanking
 * until OPF resolve finishes again.
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
  sumAlignedPnL,
  tradeToOpfStrategy,
  type OpfResolveResult,
} from "@/lib/options-lab/opfPricingApi";

export type OpfRiskGraphState = {
  loading: boolean;
  error: string | null;
  result: OpfResolveResult | null;
  spot: number | null;
  /** Fingerprint of generation content_hashes — VIEW-5 epoch */
  generationEpoch: string;
  contentHashes: Record<string, string>;
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
  /** True when painting from suite cache before first post-mount resolve */
  fromCache?: boolean;
};

const WINGS = 50;
const POLL_MS = 2500;
/** Keep graph warm across app switches for this long without a remount refresh. */
const CACHE_TTL_MS = 30 * 60 * 1000;

type GraphCacheEntry = {
  ladders: Map<string, LadderFull>;
  result: OpfResolveResult | null;
  spot: number | null;
  generationEpoch: string;
  contentHashes: Record<string, string>;
  lastResolveKey: string;
  error: string | null;
  updatedAt: number;
};

/** Module cache — survives Analyzer unmount when switching Heatmap / Volume Profile. */
const graphCache = new Map<string, GraphCacheEntry>();

/** Chain ladders by product+exp — shared across trade keys (same underlier). */
const ladderPool = new Map<string, LadderFull>();

function uniqueExpirations(trades: ParsedTosTrade[]): string[] {
  const s = new Set<string>();
  for (const trade of trades) {
    for (const l of trade.legs) s.add(l.expiration);
    if (trade.expiration) s.add(trade.expiration);
  }
  return [...s];
}

function ladderPoolKey(symbol: string, exp: string): string {
  return `${symbol.toUpperCase()}|${exp}|w${WINGS}`;
}

function cacheKey(opts: {
  trades: ParsedTosTrade[];
  useCase: string;
  packId: string | null;
  spotOverride: number | null;
  vix: number | null;
  timeOffsetHours: number;
  volOffsetPts: number;
  spotPct: number;
}): string {
  return [
    opts.trades.map((t) => `${t.symbol}:${t.raw}`).join("||"),
    opts.useCase,
    opts.packId ?? "",
    opts.spotOverride ?? "",
    opts.vix ?? "",
    opts.timeOffsetHours,
    opts.volOffsetPts,
    opts.spotPct,
  ].join("#");
}

function basisShiftFor(
  trade: ParsedTosTrade,
  result: OpfResolveResult | null,
): number {
  if (!trade.limit || trade.limit <= 0) return 0;
  const dNat = result?.marks?.package_debit_per_share;
  if (dNat == null || !Number.isFinite(dNat)) return 0;
  const limitSigned = trade.isCredit
    ? -Math.abs(trade.limit)
    : Math.abs(trade.limit);
  return (dNat - limitSigned) * 100;
}

function shiftPts(
  pts: { price: number; pnl: number }[],
  shift: number,
): { price: number; pnl: number }[] {
  if (!shift) return pts;
  return pts.map((p) => ({ price: p.price, pnl: p.pnl + shift }));
}

function readCache(key: string): GraphCacheEntry | null {
  const e = graphCache.get(key);
  if (!e) return null;
  if (Date.now() - e.updatedAt > CACHE_TTL_MS) {
    graphCache.delete(key);
    return null;
  }
  return e;
}

function writeCache(key: string, e: GraphCacheEntry): void {
  graphCache.set(key, { ...e, updatedAt: Date.now() });
  // Cap size — drop oldest
  if (graphCache.size > 12) {
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    for (const [k, v] of graphCache) {
      if (v.updatedAt < oldestAt) {
        oldestAt = v.updatedAt;
        oldestKey = k;
      }
    }
    if (oldestKey) graphCache.delete(oldestKey);
  }
}

export function useOpfRiskGraph(opts: {
  trade: ParsedTosTrade | null;
  /** Independently shown structures — each resolves on its own last-print generation. */
  trades?: ParsedTosTrade[] | null;
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
  /** Massive still printing (RTH or pre/post). False → one resolve, no interval. */
  pollLive?: boolean;
}): OpfRiskGraphState {
  const {
    trade,
    trades: tradesOpt = null,
    spotOverride = null,
    vix = null,
    useCase = "day_trade",
    packId = null,
    timeOffsetHours = 0,
    volOffsetPts = 0,
    spotPct = 0,
    enabled = true,
    pollLive = true,
  } = opts;

  const bookTrades = useMemo(() => {
    if (tradesOpt && tradesOpt.length > 0) return tradesOpt;
    return trade ? [trade] : [];
  }, [trade, tradesOpt]);

  const key = useMemo(() => {
    if (!bookTrades.length) return "";
    return cacheKey({
      trades: bookTrades,
      useCase,
      packId,
      spotOverride,
      vix,
      timeOffsetHours,
      volOffsetPts,
      spotPct,
    });
  }, [
    bookTrades,
    useCase,
    packId,
    spotOverride,
    vix,
    timeOffsetHours,
    volOffsetPts,
    spotPct,
  ]);

  const warm = key ? readCache(key) : null;

  const [loading, setLoading] = useState(() => !warm?.result);
  const [error, setError] = useState<string | null>(() => warm?.error ?? null);
  const [result, setResult] = useState<OpfResolveResult | null>(
    () => warm?.result ?? null,
  );
  const [spot, setSpot] = useState<number | null>(() => warm?.spot ?? null);
  const [generationEpoch, setGenerationEpoch] = useState(
    () => warm?.generationEpoch ?? "",
  );
  const [contentHashes, setContentHashes] = useState<Record<string, string>>(
    () => warm?.contentHashes ?? {},
  );
  const [fromCache, setFromCache] = useState(() => Boolean(warm?.result));

  const laddersRef = useRef<Map<string, LadderFull>>(
    new Map(warm?.ladders ?? []),
  );
  const tickRef = useRef(0);
  const lastResolveKey = useRef(warm?.lastResolveKey ?? "");
  const resultRef = useRef<OpfResolveResult | null>(warm?.result ?? null);
  resultRef.current = result;
  // Re-seed refs when trade key changes (new paste / card)
  const lastKeyRef = useRef(key);
  if (key !== lastKeyRef.current) {
    lastKeyRef.current = key;
    const next = key ? readCache(key) : null;
    laddersRef.current = new Map(next?.ladders ?? []);
    lastResolveKey.current = next?.lastResolveKey ?? "";
    resultRef.current = next?.result ?? null;
  }

  const run = useCallback(async (opts?: { force?: boolean; soft?: boolean }) => {
    if (!bookTrades.length || !enabled) {
      setResult(null);
      setError(null);
      setFromCache(false);
      return;
    }
    const primary = bookTrades[0];
    const tick = ++tickRef.current;
    const hasPaint =
      Boolean(resultRef.current) || Boolean(key && readCache(key)?.result);
    const soft = opts?.soft === true || (hasPaint && opts?.force !== true);
    if (!soft) setLoading(true);
    try {
      const exps = uniqueExpirations(bookTrades);
      // Seed ladders from pool if this mount's map is cold
      for (const exp of exps) {
        if (!laddersRef.current.has(exp)) {
          const pooled = ladderPool.get(ladderPoolKey(primary.symbol, exp));
          if (pooled) laddersRef.current.set(exp, pooled);
        }
      }

      const gens: ReturnType<typeof ladderToOpfGeneration>[] = [];
      let chainSpot: number | null = null;
      let chainVix: number | null = vix;

      for (const exp of exps) {
        const prev = laddersRef.current.get(exp);
        const polled = await pollChainLadder({
          expiration: exp,
          symbol: primary.symbol,
          wings: WINGS,
          since_hash: prev?.content_hash ?? null,
        });
        let ladder: LadderFull | null = prev ?? null;
        if (polled.mode === "full") {
          ladder = polled.ladder;
          laddersRef.current.set(exp, ladder);
        } else if (polled.mode === "diff" && prev) {
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
          const full = await pollChainLadder({
            expiration: exp,
            symbol: primary.symbol,
            wings: WINGS,
          });
          if (full.mode === "full") {
            ladder = full.ladder;
            laddersRef.current.set(exp, ladder);
          }
        }
        if (!ladder) {
          throw new Error(`No chain generation for ${primary.symbol} ${exp}`);
        }
        ladderPool.set(ladderPoolKey(primary.symbol, exp), ladder);
        if (chainSpot == null && ladder.spot > 0) chainSpot = ladder.spot;
        if (ladder.vix != null) chainVix = ladder.vix;
        gens.push(ladderToOpfGeneration(ladder, primary.symbol, WINGS));
      }

      const spotUse =
        spotOverride != null && spotOverride > 0
          ? spotOverride
          : chainSpot;
      if (spotUse == null || !(spotUse > 0)) {
        throw new Error("No spot from chain or override");
      }

      const hashes: Record<string, string> = {};
      for (const g of gens) {
        if (g.content_hash) hashes[g.expiration] = g.content_hash;
      }
      const epochKey = Object.entries(hashes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([e, h]) => `${e}:${h}`)
        .join("|");
      setGenerationEpoch(epochKey);
      setContentHashes(hashes);

      const resolveKey = [
        epochKey,
        useCase,
        packId,
        bookTrades.map((t) => t.raw).join("||"),
        String(spotUse),
        String(spotPct),
        String(volOffsetPts),
        String(timeOffsetHours),
      ].join("#");
      if (!opts?.force && lastResolveKey.current === resolveKey) {
        if (tick !== tickRef.current) return;
        setSpot(spotUse);
        setLoading(false);
        setFromCache(false);
        // Refresh cache timestamp / ladders even when resolve skipped
        if (key) {
          writeCache(key, {
            ladders: new Map(laddersRef.current),
            result: resultRef.current,
            spot: spotUse,
            generationEpoch: epochKey,
            contentHashes: hashes,
            lastResolveKey: resolveKey,
            error: null,
            updatedAt: Date.now(),
          });
        }
        return;
      }
      lastResolveKey.current = resolveKey;

      const allStrikes = bookTrades.flatMap((t) => t.legs.map((l) => l.strike));
      const curveRangePct = (() => {
        if (!allStrikes.length || !(spotUse > 0)) return 8;
        const span = Math.max(
          Math.abs(Math.max(...allStrikes) - spotUse),
          Math.abs(Math.min(...allStrikes) - spotUse),
        );
        return Math.max(8, Math.min(25, (span / spotUse) * 100 + 3));
      })();

      const settled = await Promise.all(
        bookTrades.map(async (t) => {
          try {
            const resolved = await resolveOpfPricing({
              use_case: useCase,
              pack_id: packId,
              strategy: tradeToOpfStrategy(t),
              generations: gens,
              spot: spotUse,
              vix: chainVix,
              what_if: {
                spot_pct: spotPct,
                vol_offset_pts: volOffsetPts,
                time_offset_hours: timeOffsetHours,
                curve_steps: 161,
                curve_range_pct: curveRangePct,
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
            return { trade: t, resolved, error: null as string | null };
          } catch (e) {
            return {
              trade: t,
              resolved: null as OpfResolveResult | null,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        }),
      );

      if (tick !== tickRef.current) return;

      const ok = settled.filter((s) => s.resolved);
      if (ok.length === 0) {
        const msg = settled[0]?.error || "OPF resolve incomplete";
        setSpot(spotUse);
        setError(msg);
        if (!soft) {
          setResult(null);
          resultRef.current = null;
        }
        setFromCache(false);
        return;
      }

      const expSeries = ok.map((s) =>
        shiftPts(
          opfCurveToPnLPoints(s.resolved!.curves?.expiration?.points),
          basisShiftFor(s.trade, s.resolved),
        ),
      );
      const theoSeries = ok.map((s) =>
        shiftPts(
          opfCurveToPnLPoints(s.resolved!.curves?.model_t0?.points),
          basisShiftFor(s.trade, s.resolved),
        ),
      );
      const expPts = sumAlignedPnL(expSeries);
      const theoPts = sumAlignedPnL(theoSeries);
      const pkg = ok.reduce((sum, s) => {
        const d = s.resolved!.marks?.package_debit_per_share;
        return sum + (d != null && Number.isFinite(d) ? d : 0);
      }, 0);

      const head = ok[0].resolved!;
      const merged: OpfResolveResult = {
        ...head,
        complete: true,
        marks: {
          ...head.marks,
          package_debit_per_share: pkg,
          complete: true,
        },
        curves: {
          expiration: {
            label: head.curves?.expiration?.label,
            points: expPts.map((p) => ({ x: p.price, y: p.pnl })),
          },
          model_t0: {
            label: head.curves?.model_t0?.label,
            points: theoPts.map((p) => ({ x: p.price, y: p.pnl })),
          },
        },
        meta: {
          ...head.meta,
          error: null,
        },
      };

      setSpot(spotUse);
      setResult(merged);
      resultRef.current = merged;
      setFromCache(false);
      const leftover = settled.filter((s) => !s.resolved);
      const errMsg =
        leftover.length && ok.length === 0
          ? leftover[0]?.error ?? "OPF resolve incomplete"
          : null;
      setError(errMsg);
      if (key) {
        writeCache(key, {
          ladders: new Map(laddersRef.current),
          result: merged,
          spot: spotUse,
          generationEpoch: epochKey,
          contentHashes: hashes,
          lastResolveKey: resolveKey,
          error: errMsg,
          updatedAt: Date.now(),
        });
      }
    } catch (e) {
      if (tick !== tickRef.current) return;
      // Keep last good curves on soft refresh failure
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (!soft) {
        setResult(null);
        resultRef.current = null;
      }
      setFromCache(false);
    } finally {
      if (tick === tickRef.current) setLoading(false);
    }
  }, [
    bookTrades,
    enabled,
    spotOverride,
    vix,
    useCase,
    packId,
    timeOffsetHours,
    volOffsetPts,
    spotPct,
    key,
  ]);

  // When cache key changes, rehydrate React state from module cache
  useEffect(() => {
    if (!key) {
      setResult(null);
      setError(null);
      setSpot(null);
      setGenerationEpoch("");
      setContentHashes({});
      setFromCache(false);
      setLoading(false);
      return;
    }
    const c = readCache(key);
    if (c?.result) {
      setResult(c.result);
      setSpot(c.spot);
      setGenerationEpoch(c.generationEpoch);
      setContentHashes(c.contentHashes);
      setError(c.error);
      setFromCache(true);
      setLoading(false);
      laddersRef.current = new Map(c.ladders);
      lastResolveKey.current = c.lastResolveKey;
    } else {
      setFromCache(false);
      // Cold start — show spinner only if we have no curves
      setLoading(true);
    }
  }, [key]);

  useEffect(() => {
    if (!bookTrades.length || !enabled) return;
    // Soft refresh when we already have paint; hard only when cold
    const hasPaint = Boolean(readCache(key)?.result || result);
    void run({ soft: hasPaint });
    if (!pollLive) {
      return;
    }
    const id = window.setInterval(() => void run({ soft: true }), POLL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, bookTrades, enabled, key, pollLive]);

  // Basis is applied per structure before the book sum — do not shift again.
  const expirationPoints = useMemo(
    () => opfCurveToPnLPoints(result?.curves?.expiration?.points),
    [result],
  );
  const theoreticalPoints = useMemo(
    () => opfCurveToPnLPoints(result?.curves?.model_t0?.points),
    [result],
  );

  const allStrikes = useMemo(
    () => bookTrades.flatMap((t) => t.legs.map((l) => l.strike)),
    [bookTrades],
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
    generationEpoch,
    contentHashes,
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
    fromCache,
    refresh: () => {
      lastResolveKey.current = "";
      void run({ force: true, soft: false });
    },
  };
}
