"use client";

/**
 * Canonical hook for live underlier marks (site-wide pattern).
 * @see liveUnderlierPattern.ts
 *
 * HTTP side shares one tab-wide poll (sharedUniversePoll) so many mounts do
 * not multiply ensure_fresh. WS side binds via useSymbolMarks with equality
 * guards to avoid render storms.
 */

import { useEffect, useMemo, useState } from "react";
import type { MarketUniverseSymbol } from "@/lib/capitalApi";
import {
  bindUnderlierMark,
  LIVE_UNDERLIER_POLL_MS,
  type BoundUnderlierMark,
} from "@/lib/market/liveUnderlierPattern";
import { subscribeSharedUniverse } from "@/lib/market/sharedUniversePoll";
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
    // Stable when caller passes a new array with same contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts?.symbols?.join(",")],
  );

  const [base, setBase] = useState<MarketUniverseSymbol[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastHttpAt, setLastHttpAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    return subscribeSharedUniverse(
      enabledOnly,
      (snap) => {
        if (snap.enabledOnly !== enabledOnly) return;
        let list = snap.symbols || [];
        if (filterKey) {
          const want = new Set(filterKey.split(","));
          list = list.filter((r) =>
            want.has(String(r.symbol || "").toUpperCase()),
          );
        }
        setBase((prev) => {
          // Identity-stable when shared poll reuses the same array
          if (prev === list) return prev;
          if (
            prev.length === list.length &&
            prev.every(
              (r, i) =>
                r.symbol === list[i]?.symbol &&
                r.mid === list[i]?.mid &&
                r.proxy_mid === list[i]?.proxy_mid &&
                r.mark_asof === list[i]?.mark_asof,
            )
          ) {
            return prev;
          }
          return list;
        });
        setLastHttpAt(snap.fetchedAt);
        setError(snap.error);
        setTick((n) => n + 1);
      },
      { pollMs },
    );
  }, [enabled, enabledOnly, filterKey, pollMs, reloadNonce]);

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
  }, [base, marks]);

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
    reload: () => setReloadNonce((n) => n + 1),
    lastHttpAt,
    tick,
  };
}

/** @deprecated Use useLiveUnderlierMarks */
export { useLiveUnderlierMarks as useLiveUniverseMarks };
