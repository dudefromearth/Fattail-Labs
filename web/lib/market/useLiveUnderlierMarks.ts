"use client";

/**
 * Canonical hook for live underlier marks (site-wide pattern).
 * @see liveUnderlierPattern.ts
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMarketUniverse,
  type MarketUniverseSymbol,
} from "@/lib/capitalApi";
import {
  bindUnderlierMark,
  LIVE_UNDERLIER_POLL_MS,
  type BoundUnderlierMark,
} from "@/lib/market/liveUnderlierPattern";
import { useSymbolMarks } from "@/lib/market/useSymbolMarks";

export type LiveUnderlierRow = MarketUniverseSymbol & {
  mark: BoundUnderlierMark;
  /** @deprecated use mark.mid */
  displayMid: number | null;
  proxyMid: number | null;
  viaProxy: boolean;
};

export function useLiveUnderlierMarks(opts?: {
  enabledOnly?: boolean;
  pollMs?: number;
  enabled?: boolean;
  /** Limit to these symbols (Positions equity underliers). */
  symbols?: string[] | null;
}): {
  rows: LiveUnderlierRow[];
  /** Map product → bound mark (for Positions overlay). */
  bySymbol: Map<string, BoundUnderlierMark>;
  symbols: string[];
  transport: "stream" | "idle" | "error" | "http";
  error: string | null;
  reload: () => void;
  lastHttpAt: number | null;
  tick: number;
} {
  const enabledOnly = opts?.enabledOnly !== false;
  const pollMs = opts?.pollMs ?? LIVE_UNDERLIER_POLL_MS;
  const enabled = opts?.enabled !== false;
  const filterKey = useMemo(
    () =>
      opts?.symbols?.length
        ? [...new Set(opts.symbols.map((s) => s.toUpperCase()))].sort().join(",")
        : "",
    [opts?.symbols],
  );

  const [base, setBase] = useState<MarketUniverseSymbol[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastHttpAt, setLastHttpAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const d = await fetchMarketUniverse({ enabledOnly });
      let list = d.symbols || [];
      if (filterKey) {
        const want = new Set(filterKey.split(","));
        list = list.filter((r) =>
          want.has(String(r.symbol || "").toUpperCase()),
        );
      }
      setBase([...list]);
      setLastHttpAt(Date.now());
      setError(null);
      setTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [enabled, enabledOnly, filterKey]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    let t: number | null = null;
    const tickFn = () => {
      if (document.visibilityState === "visible") void load();
    };
    const start = () => {
      if (t != null) return;
      t = window.setInterval(tickFn, pollMs);
    };
    const stop = () => {
      if (t != null) {
        window.clearInterval(t);
        t = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        tickFn();
        start();
      } else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, pollMs, enabled]);

  const symbols = useMemo(
    () =>
      base.map((r) => String(r.symbol || "").toUpperCase()).filter(Boolean),
    [base],
  );

  const { marks, transport: wsTransport } = useSymbolMarks({
    symbols,
    enabled: enabled && symbols.length > 0,
  });

  const rows = useMemo((): LiveUnderlierRow[] => {
    return base.map((r) => {
      const key = String(r.symbol || "").toUpperCase();
      const stream = marks.get(key);
      const mark = bindUnderlierMark(key, r, stream);
      return {
        ...r,
        symbol: key,
        mark,
        displayMid: mark.mid,
        proxyMid: mark.proxyMid,
        viaProxy: mark.viaProxy,
        mid: mark.mid,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, marks, tick]);

  const bySymbol = useMemo(() => {
    const m = new Map<string, BoundUnderlierMark>();
    for (const r of rows) m.set(r.symbol, r.mark);
    return m;
  }, [rows]);

  const transport: "stream" | "idle" | "error" | "http" =
    wsTransport === "stream"
      ? "stream"
      : lastHttpAt
        ? "http"
        : wsTransport === "error"
          ? "error"
          : "idle";

  return {
    rows,
    bySymbol,
    symbols,
    transport,
    error,
    reload: () => void load(),
    lastHttpAt,
    tick,
  };
}

/** @deprecated Use useLiveUnderlierMarks */
export { useLiveUnderlierMarks as useLiveUniverseMarks };
