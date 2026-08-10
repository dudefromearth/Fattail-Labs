"use client";

/**
 * Subscribe to a chain topic via the shared MarketSocket (one WS per tab).
 * Falls back to HTTP poll when WS is unavailable.
 */

import { useEffect, useRef, useState } from "react";
import { getMarketSocket } from "./MarketSocket";
import type { ChainMessage } from "./types";
import {
  applyLadderDiff,
  pollChainLadder,
  type LadderRow,
} from "@/lib/chainLadderApi";

export function useOptionChainBus(opts: {
  symbol: string;
  expiration: string;
  side: "call" | "put";
  wings: number;
  enabled?: boolean;
}): {
  rows: Map<number, LadderRow>;
  hash: string | null;
  spot: number | null;
  error: string | null;
  transport: "ws" | "poll" | "idle";
} {
  const { symbol, expiration, side, wings, enabled = true } = opts;
  const [rows, setRows] = useState<Map<number, LadderRow>>(() => new Map());
  const [hash, setHash] = useState<string | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<"ws" | "poll" | "idle">("idle");
  const hashRef = useRef<string | null>(null);
  const interestId = `chain:${symbol}:${expiration}:${side}:w${wings}`;

  // Prefer WS shared client
  useEffect(() => {
    if (!enabled || !expiration || !symbol) return;
    const sock = getMarketSocket();
    setTransport("ws");
    sock.setChainInterest(interestId, { symbol, expiration, side, wings });
    const unsub = sock.subscribe((msg) => {
      if (msg.t === "err") {
        setError(String((msg as { message?: string }).message || "stream error"));
        return;
      }
      if (msg.t !== "chain") return;
      const m = msg as ChainMessage;
      if (m.mode === "full" && m.ladder) {
        const ladder = m.ladder as {
          rows?: LadderRow[];
          content_hash?: string;
          spot?: number;
        };
        const next = new Map<number, LadderRow>();
        for (const r of ladder.rows || []) next.set(Number(r.strike), r);
        setRows(next);
        hashRef.current = ladder.content_hash || m.content_hash || null;
        setHash(hashRef.current);
        if (ladder.spot != null) setSpot(Number(ladder.spot));
        setError(null);
      }
    });
    return () => {
      sock.setChainInterest(interestId, null);
      unsub();
    };
  }, [enabled, symbol, expiration, side, wings, interestId]);

  // Poll fallback (also works when bus not enabled)
  useEffect(() => {
    if (!enabled || !expiration) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const result = await pollChainLadder({
          expiration,
          symbol,
          side,
          wings,
          since_hash: hashRef.current,
        });
        if (cancelled) return;
        setTransport((t) => (t === "ws" ? t : "poll"));
        setRows((prev) => {
          const { next, meta, hash: h } = applyLadderDiff(prev, result);
          hashRef.current = h;
          queueMicrotask(() => {
            if (cancelled) return;
            setHash(h);
            if (meta?.spot != null) setSpot(Number(meta.spot));
            setError(null);
          });
          return next;
        });
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "poll failed");
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, symbol, expiration, side, wings]);

  return { rows, hash, spot, error, transport };
}
