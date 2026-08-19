/**
 * Live OPF risk graph for Options Lab Analyzer.
 * Hydrates dual-side chain generations per leg expiration, then prices the
 * 161-pt book locally (`resolveLocalBookCurves`). Working and Away share
 * this path — keep-warm is only the rate.
 *
 * Suite keep-warm: results + ladder generations live in a module cache so
 * Heatmap ↔ Analyzer route switches re-paint instantly instead of blanking
 * until the next local sheet.
 *
 * Polling never stops while the plane is printing: 2.5s in focus, 5s when
 * the tab is hidden or Analyzer is unmounted. Last curves stay; return is
 * a rate change, not a redraw from empty.
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
  sumAlignedPnL,
  type OpfGenerationIn,
  type OpfResolveResult,
} from "@/lib/options-lab/opfPricingApi";
import { resolveLocalBookCurves } from "@/lib/options-lab/localBookCurves";
import { packageUnitScale } from "@/lib/options-lab/packageEconomics";

export type OpfRiskGraphState = {
  loading: boolean;
  error: string | null;
  result: OpfResolveResult | null;
  spot: number | null;
  /** OPF-held generations used for the last local sheet (What-if σ_m). */
  generations: OpfGenerationIn[];
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
/**
 * Three-tier poll (Analyzer is the working page).
 *
 * | State | Interval | Why |
 * | Working, ≥1 shown | 2.5s | Curves stay live while the member is in the seat |
 * | Away, ≥1 shown | 5s | Last paint stays current; return is not a blank wait |
 * | No shown cards | 30s | Poll stays on (warm plane) but almost no OPF resolve |
 * | Plane not printing | off | Last print is held; do not invent live |
 *
 * Cost of one *full* tick: 1 ladder HTTP per expiration + one local 161-pt
 * sheet per shown structure. Canvas draw is cheap. `/resolve` is not on this
 * clock. Hidden tab: browser already skips paint.
 */
export const OPF_POLL_MS = 2500;
export const OPF_AWAY_POLL_MS = 5_000;
/** No visible positions — keep the process alive, minimize work. */
export const OPF_IDLE_POLL_MS = 30_000;
const CACHE_TTL_MS = 30 * 60 * 1000;

export function opfPollIntervalMs(opts: {
  pollLive: boolean;
  mounted: boolean;
  hidden: boolean;
  hasVisible: boolean;
}): number | null {
  if (!opts.pollLive) return null;
  if (!opts.hasVisible) return OPF_IDLE_POLL_MS;
  if (!opts.mounted || opts.hidden) return OPF_AWAY_POLL_MS;
  return OPF_POLL_MS;
}

type GraphCacheEntry = {
  ladders: Map<string, LadderFull>;
  result: OpfResolveResult | null;
  spot: number | null;
  generations: OpfGenerationIn[];
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

/**
 * ToS / card @limit is per position. Local sheet debit is the sum over
 * already-scaled legs (Qty applied). Shift uses Qty × limit.
 */
export function basisShiftFor(
  trade: ParsedTosTrade,
  result: OpfResolveResult | null,
): number {
  if (!trade.limit || trade.limit <= 0) return 0;
  const dNat = result?.marks?.package_debit_per_share;
  if (dNat == null || !Number.isFinite(dNat)) return 0;
  const pkgs = packageUnitScale(trade.legs);
  const limitSigned =
    (trade.isCredit ? -Math.abs(trade.limit) : Math.abs(trade.limit)) * pkgs;
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

type WarmJob = {
  bookTrades: ParsedTosTrade[];
  key: string;
  spotOverride: number | null;
  vix: number | null;
  useCase: "day_trade" | "outlook" | "backtest";
  packId: string | null;
  timeOffsetHours: number;
  volOffsetPts: number;
  spotPct: number;
  ladders: Map<string, LadderFull>;
  lastResolveKey: string;
};

/**
 * Survives Analyzer unmount. Slow-polls the last book so a return paints
 * current curves instead of a blank wait.
 */
const keepWarm = {
  job: null as WarmJob | null,
  pollLive: false,
  subscribers: 0,
  hidden: false,
  hasVisible: true,
  intervalId: null as number | null,
  idleTimer: null as number | null,
  onTick: null as null | ((entry: GraphCacheEntry) => void),
};

function keepWarmHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function syncKeepWarmInterval(): void {
  if (typeof window === "undefined") return;
  if (keepWarm.intervalId != null) {
    window.clearInterval(keepWarm.intervalId);
    keepWarm.intervalId = null;
  }
  keepWarm.hidden = keepWarmHidden();
  const ms = opfPollIntervalMs({
    pollLive: keepWarm.pollLive,
    mounted: keepWarm.subscribers > 0,
    hidden: keepWarm.hidden,
    hasVisible: keepWarm.hasVisible,
  });
  if (ms == null || !keepWarm.job) return;
  keepWarm.intervalId = window.setInterval(() => {
    const job = keepWarm.job;
    if (!job || !keepWarm.hasVisible) return;
    void resolveAndCache(job)
      .then((entry) => keepWarm.onTick?.(entry))
      .catch(() => {
        /* last cache entry stays — do not blank */
      });
  }, ms);
}

function stopKeepWarm(): void {
  keepWarm.job = null;
  keepWarm.pollLive = false;
  keepWarm.hasVisible = false;
  keepWarm.onTick = null;
  if (keepWarm.idleTimer != null) {
    window.clearTimeout(keepWarm.idleTimer);
    keepWarm.idleTimer = null;
  }
  syncKeepWarmInterval();
}

function attachKeepWarm(
  job: WarmJob,
  pollLive: boolean,
  onTick?: (entry: GraphCacheEntry) => void,
): () => void {
  keepWarm.job = job;
  keepWarm.pollLive = pollLive;
  keepWarm.hasVisible = true;
  keepWarm.onTick = onTick ?? null;
  keepWarm.subscribers += 1;
  if (keepWarm.idleTimer != null) {
    window.clearTimeout(keepWarm.idleTimer);
    keepWarm.idleTimer = null;
  }
  keepWarm.hidden = keepWarmHidden();
  const onVis = () => {
    const wasHidden = keepWarm.hidden;
    keepWarm.hidden = keepWarmHidden();
    syncKeepWarmInterval();
    if (wasHidden && !keepWarm.hidden && keepWarm.job) {
      void resolveAndCache(keepWarm.job)
        .then((entry) => keepWarm.onTick?.(entry))
        .catch(() => undefined);
    }
  };
  document.addEventListener("visibilitychange", onVis);
  syncKeepWarmInterval();
  return () => {
    document.removeEventListener("visibilitychange", onVis);
    keepWarm.subscribers = Math.max(0, keepWarm.subscribers - 1);
    if (keepWarm.subscribers === 0) keepWarm.onTick = null;
    syncKeepWarmInterval();
    if (keepWarm.subscribers === 0 && keepWarm.pollLive) {
      if (keepWarm.idleTimer != null) window.clearTimeout(keepWarm.idleTimer);
      keepWarm.idleTimer = window.setTimeout(() => {
        keepWarm.job = null;
        keepWarm.pollLive = false;
        syncKeepWarmInterval();
      }, CACHE_TTL_MS);
    }
  };
}

async function resolveAndCache(job: WarmJob): Promise<GraphCacheEntry> {
  const {
    bookTrades,
    key,
    spotOverride,
    useCase,
    packId,
    timeOffsetHours,
    volOffsetPts,
    spotPct,
    ladders,
  } = job;
  const primary = bookTrades[0];
  const exps = uniqueExpirations(bookTrades);
  for (const exp of exps) {
    if (!ladders.has(exp)) {
      const pooled = ladderPool.get(ladderPoolKey(primary.symbol, exp));
      if (pooled) ladders.set(exp, pooled);
    }
  }

  const gens: ReturnType<typeof ladderToOpfGeneration>[] = [];
  let chainSpot: number | null = null;

  for (const exp of exps) {
    const prev = ladders.get(exp);
    const polled = await pollChainLadder({
      expiration: exp,
      symbol: primary.symbol,
      wings: WINGS,
      since_hash: prev?.content_hash ?? null,
    });
    let ladder: LadderFull | null = prev ?? null;
    if (polled.mode === "full") {
      ladder = polled.ladder;
      ladders.set(exp, ladder);
    } else if (polled.mode === "diff" && prev) {
      const byKey = new Map(
        prev.rows.map((r) => [
          `${(r.side || "call").toLowerCase()}:${r.strike}`,
          r,
        ]),
      );
      for (const u of polled.upserts || []) {
        byKey.set(`${(u.side || "call").toLowerCase()}:${u.strike}`, u);
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
      ladders.set(exp, ladder);
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
        ladders.set(exp, ladder);
      }
    }
    if (!ladder) {
      throw new Error(`No chain generation for ${primary.symbol} ${exp}`);
    }
    ladderPool.set(ladderPoolKey(primary.symbol, exp), ladder);
    if (chainSpot == null && ladder.spot > 0) chainSpot = ladder.spot;
    gens.push(ladderToOpfGeneration(ladder, primary.symbol, WINGS));
  }

  const spotUse =
    spotOverride != null && spotOverride > 0 ? spotOverride : chainSpot;
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

  const cached = readCache(key);
  if (job.lastResolveKey === resolveKey && cached?.result) {
    const entry: GraphCacheEntry = {
      ...cached,
      ladders: new Map(ladders),
      spot: spotUse,
      generations: gens,
      generationEpoch: epochKey,
      contentHashes: hashes,
      lastResolveKey: resolveKey,
      error: null,
      updatedAt: Date.now(),
    };
    writeCache(key, entry);
    return entry;
  }

  const allStrikes = bookTrades.flatMap((t) => t.legs.map((l) => l.strike));
  const curveRangePct = (() => {
    if (!allStrikes.length || !(spotUse > 0)) return 8;
    const span = Math.max(
      Math.abs(Math.max(...allStrikes) - spotUse),
      Math.abs(Math.min(...allStrikes) - spotUse),
    );
    return Math.max(8, Math.min(25, (span / spotUse) * 100 + 3));
  })();

  const settled = bookTrades.map((t) => {
    const local = resolveLocalBookCurves({
      trade: t,
      generations: gens,
      spot: spotUse,
      volOffsetPts,
      timeOffsetHours,
      spotPct,
      curveSteps: 161,
      curveRangePct,
      useCase,
      packId,
      nowMs: Date.now(),
    });
    if (!local.ok) {
      return {
        trade: t,
        resolved: null as OpfResolveResult | null,
        error: local.detail,
      };
    }
    return { trade: t, resolved: local.result, error: null as string | null };
  });

  const ok = settled.filter((s) => s.resolved);
  if (ok.length === 0) {
    const msg = settled[0]?.error || "Local sheet incomplete";
    const entry: GraphCacheEntry = {
      ladders: new Map(ladders),
      result: cached?.result ?? null,
      spot: spotUse,
      generations: gens,
      generationEpoch: epochKey,
      contentHashes: hashes,
      lastResolveKey: job.lastResolveKey,
      error: msg,
      updatedAt: Date.now(),
    };
    writeCache(key, entry);
    return entry;
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
  const allLegMarks = ok.flatMap((s) => s.resolved!.marks?.leg_marks || []);
  const merged: OpfResolveResult = {
    ...head,
    complete: true,
    marks: {
      ...head.marks,
      package_debit_per_share: pkg,
      complete: true,
      leg_marks: allLegMarks.length ? allLegMarks : head.marks?.leg_marks,
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

  const leftover = settled.filter((s) => !s.resolved);
  const errMsg =
    leftover.length && ok.length === 0
      ? leftover[0]?.error ?? "Local sheet incomplete"
      : null;
  job.lastResolveKey = resolveKey;
  const entry: GraphCacheEntry = {
    ladders: new Map(ladders),
    result: merged,
    spot: spotUse,
    generations: gens,
    generationEpoch: epochKey,
    contentHashes: hashes,
    lastResolveKey: resolveKey,
    error: errMsg,
    updatedAt: Date.now(),
  };
  writeCache(key, entry);
  return entry;
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
  const [generations, setGenerations] = useState<OpfGenerationIn[]>(
    () => warm?.generations ?? [],
  );

  const laddersRef = useRef<Map<string, LadderFull>>(
    new Map(warm?.ladders ?? []),
  );
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

  const applyEntry = useCallback((entry: GraphCacheEntry) => {
    setSpot(entry.spot);
    if (entry.result) {
      setResult(entry.result);
      resultRef.current = entry.result;
    }
    setGenerations(entry.generations ?? []);
    setGenerationEpoch(entry.generationEpoch);
    setContentHashes(entry.contentHashes);
    setError(entry.error);
    setFromCache(false);
    setLoading(false);
    lastResolveKey.current = entry.lastResolveKey;
    laddersRef.current = new Map(entry.ladders);
  }, []);

  const makeJob = useCallback((): WarmJob | null => {
    if (!bookTrades.length || !key) return null;
    return {
      bookTrades,
      key,
      spotOverride,
      vix,
      useCase,
      packId,
      timeOffsetHours,
      volOffsetPts,
      spotPct,
      ladders: laddersRef.current,
      lastResolveKey: lastResolveKey.current,
    };
  }, [
    bookTrades,
    key,
    spotOverride,
    vix,
    useCase,
    packId,
    timeOffsetHours,
    volOffsetPts,
    spotPct,
  ]);

  const run = useCallback(async (opts?: { force?: boolean; soft?: boolean }) => {
    if (!bookTrades.length || !enabled) {
      return;
    }
    const hasPaint =
      Boolean(resultRef.current) || Boolean(key && readCache(key)?.result);
    const soft = opts?.soft === true || (hasPaint && opts?.force !== true);
    if (!soft) setLoading(true);
    if (opts?.force) lastResolveKey.current = "";
    const job = makeJob();
    if (!job) return;
    try {
      const entry = await resolveAndCache(job);
      applyEntry(entry);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (!soft) {
        setResult(null);
        resultRef.current = null;
      }
      setFromCache(false);
      setLoading(false);
    }
  }, [bookTrades, enabled, key, makeJob, applyEntry]);

  // When cache key changes, rehydrate React state from module cache
  useEffect(() => {
    if (!key) {
      // Confirmed empty book (no shown trades). Leave last paint only if
      // nothing was ever resolved this mount; otherwise clear.
      if (!resultRef.current) {
        setResult(null);
        setError(null);
        setSpot(null);
        setGenerations([]);
        setGenerationEpoch("");
        setContentHashes({});
        setFromCache(false);
        setLoading(false);
      }
      return;
    }
    const c = readCache(key);
    if (c?.result) {
      setResult(c.result);
      setSpot(c.spot);
      setGenerations(c.generations ?? []);
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
    if (!bookTrades.length || !enabled) {
      // Nothing shown — stop the heavy resolve. Session posture still ticks
      // (~10s). Last cache stays so Show-on again paints immediately.
      stopKeepWarm();
      return;
    }
    const job = makeJob();
    if (!job) return;
    const hasPaint = Boolean(readCache(key)?.result || resultRef.current);
    if (!hasPaint) setLoading(true);
    void resolveAndCache(job)
      .then(applyEntry)
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
    if (!pollLive) return;
    // Always polling: 2.5s while focused, 5s while away. Last paint is never cleared.
    return attachKeepWarm(job, true, applyEntry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, bookTrades, enabled, key, pollLive, makeJob, applyEntry]);

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
    generations,
    refresh: () => {
      lastResolveKey.current = "";
      void run({ force: true, soft: false });
    },
  };
}
