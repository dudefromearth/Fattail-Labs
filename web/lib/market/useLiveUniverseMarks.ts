"use client";

/**
 * Live underlier table: each row is bound only to mark data for that symbol key.
 * Never cross-fill SPY mid onto SPX. Proxy mids are separate and labeled.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMarketUniverse,
  type MarketUniverseSymbol,
} from "@/lib/capitalApi";
import { useSymbolMarks, type SymbolMark } from "@/lib/market/useSymbolMarks";

export type LiveUniverseRow = MarketUniverseSymbol & {
  /** True product mid (never a silent proxy). */
  displayMid?: number | null;
  /** ETF proxy mid when native index print unavailable. */
  proxyMid?: number | null;
  viaProxy?: boolean;
  feedUsed?: string | null;
  liveMid?: number | null;
  mark_plane?: string | null;
  mark_age_seconds?: number | null;
  mark_stale?: boolean | null;
  mark_source?: string | null;
};

function isProxyMark(
  live: SymbolMark | undefined,
  row: MarketUniverseSymbol & {
    mark_via_proxy?: boolean;
    mark_source?: string | null;
  },
): boolean {
  if (live?.source && /proxy/i.test(live.source)) return true;
  if (row.mark_via_proxy) return true;
  if (row.mark_source && /proxy/i.test(row.mark_source)) return true;
  return false;
}

export function useLiveUniverseMarks(opts?: {
  enabledOnly?: boolean;
  pollMs?: number;
  enabled?: boolean;
}): {
  rows: LiveUniverseRow[];
  symbols: string[];
  transport: "stream" | "idle" | "error";
  error: string | null;
  reload: () => void;
  lastHttpAt: number | null;
} {
  const enabledOnly = opts?.enabledOnly !== false;
  const pollMs = opts?.pollMs ?? 8000;
  const enabled = opts?.enabled !== false;

  const [base, setBase] = useState<MarketUniverseSymbol[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastHttpAt, setLastHttpAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const d = await fetchMarketUniverse({ enabledOnly });
      setBase(d.symbols || []);
      setLastHttpAt(Date.now());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [enabled, enabledOnly]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    let t: number | null = null;
    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };
    const start = () => {
      if (t != null) return;
      t = window.setInterval(tick, pollMs);
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
  }, [load, pollMs, enabled]);

  const symbols = useMemo(
    () =>
      base
        .map((r) => String(r.symbol || "").toUpperCase())
        .filter(Boolean),
    [base],
  );

  const { marks, transport } = useSymbolMarks({
    symbols,
    enabled: enabled && symbols.length > 0,
  });

  const rows = useMemo((): LiveUniverseRow[] => {
    return base.map((r) => {
      const key = String(r.symbol || "").toUpperCase();
      // Strict bind: only this product's bus key
      const live = marks.get(key);
      const liveOk =
        live != null &&
        (live.symbol == null || live.symbol.toUpperCase() === key);

      const viaProxy = isProxyMark(liveOk ? live : undefined, r as LiveUniverseRow);
      const streamMid =
        liveOk && live.mid != null && Number.isFinite(live.mid) ? live.mid : null;
      const httpMid =
        r.mid != null && Number.isFinite(Number(r.mid)) ? Number(r.mid) : null;
      const httpProxy =
        (r as LiveUniverseRow).proxy_mid != null
          ? Number((r as LiveUniverseRow).proxy_mid)
          : null;

      // Native mid: stream first, then HTTP — never use proxy as native
      let displayMid: number | null = null;
      let proxyMid: number | null = null;
      if (viaProxy) {
        proxyMid = streamMid ?? httpProxy ?? httpMid;
        displayMid = null;
      } else {
        displayMid = streamMid ?? httpMid;
        proxyMid = null;
      }

      return {
        ...r,
        symbol: key,
        liveMid: streamMid,
        displayMid,
        proxyMid,
        viaProxy,
        mid: displayMid,
        feedUsed: liveOk ? live?.source : (r as LiveUniverseRow).mark_feed_used,
        mark_plane: liveOk
          ? live?.plane ?? "mb:sym"
          : ((r as LiveUniverseRow).mark_plane ?? null),
        mark_source: liveOk
          ? live?.source ?? null
          : ((r as LiveUniverseRow).mark_source ?? null),
        mark_age_seconds: (r as LiveUniverseRow).mark_age_seconds ?? null,
        mark_stale: viaProxy ? true : (r as LiveUniverseRow).mark_stale,
      };
    });
  }, [base, marks]);

  return {
    rows,
    symbols,
    transport,
    error,
    reload: () => void load(),
    lastHttpAt,
  };
}
