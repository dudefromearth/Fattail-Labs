"use client";

/**
 * Shared underlier marks via Market Bus (one WS/tab — MB3).
 * Snapshot on sub + continuous sym pushes from market_stream.
 */

import { useEffect, useMemo, useState } from "react";
import { getMarketSocket } from "./MarketSocket";

export type SymbolMark = {
  symbol: string;
  mid: number | null;
  bid?: number | null;
  ask?: number | null;
  source?: string;
  plane?: string;
  asOf?: string | null;
  stale?: boolean;
  via_proxy?: boolean;
  feed_used?: string;
};

export function useSymbolMarks(opts: {
  symbols: string[];
  enabled?: boolean;
}): {
  marks: Map<string, SymbolMark>;
  transport: "stream" | "idle" | "error";
  error: string | null;
} {
  const { symbols, enabled = true } = opts;
  const key = useMemo(
    () =>
      [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))]
        .sort()
        .join(","),
    [symbols],
  );
  const symList = useMemo(
    () => (key ? key.split(",") : []),
    [key],
  );

  const [marks, setMarks] = useState<Map<string, SymbolMark>>(() => new Map());
  const [transport, setTransport] = useState<"stream" | "idle" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interestId = `sym-marks:${key || "empty"}`;
    if (!enabled || !symList.length) {
      setTransport("idle");
      getMarketSocket().setSymbolInterest(interestId, null);
      return;
    }

    const sock = getMarketSocket();
    sock.setSymbolInterest(interestId, symList);

    const unsub = sock.subscribe((msg) => {
      if (msg.t === "err") {
        setError(String((msg as { message?: string }).message || "stream error"));
        setTransport("error");
        return;
      }
      if (msg.t === "hello" || msg.t === "sub_ok" || msg.t === "pong") {
        setTransport("stream");
        return;
      }
      if (msg.t !== "sym") return;
      const m = msg as {
        symbol?: string;
        mid?: number | null;
        bid?: number | null;
        ask?: number | null;
        source?: string;
        plane?: string;
        ts?: number;
        via_proxy?: boolean;
        mid_is_proxy?: boolean;
        feed_used?: string;
      };
      const sym = String(m.symbol || "").toUpperCase();
      // Strict: only accept if this interest list includes the product key
      if (!sym || !symList.includes(sym)) return;
      setMarks((prev) => {
        const next = new Map(prev);
        next.set(sym, {
          symbol: sym,
          mid: m.mid != null && Number.isFinite(Number(m.mid)) ? Number(m.mid) : null,
          bid: m.bid != null ? Number(m.bid) : null,
          ask: m.ask != null ? Number(m.ask) : null,
          source: m.source,
          plane: m.plane || "mb:sym",
          asOf: m.ts != null ? new Date(Number(m.ts) * 1000).toISOString() : null,
          via_proxy: Boolean(m.via_proxy || m.mid_is_proxy),
          feed_used: m.feed_used,
        });
        return next;
      });
      setTransport("stream");
      setError(null);
    });

    return () => {
      unsub();
      sock.setSymbolInterest(interestId, null);
    };
  }, [enabled, key, symList]);

  return { marks, transport, error };
}
