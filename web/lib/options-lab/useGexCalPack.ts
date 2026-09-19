"use client";

/**
 * Term Mass pack: attach N listed expirations on the existing MarketSocket
 * (one WS/tab). Same chain-ladder hydrate path. No second Massive client.
 */

import { useEffect, useMemo, useState } from "react";
import { getMarketSocket } from "@/lib/market/MarketSocket";
import {
  pollChainLadder,
  type LadderFull,
} from "@/lib/chainLadderApi";
import { chainContextFromLadder } from "@/lib/options-lab/templates/chainContext";
import type { GexCalBook, GexCalPack } from "@/lib/options-lab/templates/gexCal";

export function useGexCalPack(opts: {
  enabled: boolean;
  symbol: string;
  wings: number;
  spot: number | null;
  viewSide: "call" | "put";
  visibleExpirations: string[];
}): GexCalPack {
  const { enabled, symbol, wings, spot, viewSide, visibleExpirations } = opts;
  const visKey = visibleExpirations
    .map((e) => (e || "").slice(0, 10))
    .filter(Boolean)
    .join("|");
  const vis = useMemo(
    () => (visKey ? visKey.split("|") : []),
    [visKey],
  );
  const [books, setBooks] = useState<Map<string, GexCalBook>>(() => new Map());

  useEffect(() => {
    if (!enabled || !symbol || !visKey) {
      setBooks((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }
    const list = visKey.split("|");
    const sock = getMarketSocket();
    const ids: string[] = [];
    for (const exp of list) {
      const id = `chain:${symbol}:${exp}:w${wings}`;
      ids.push(id);
      sock.setChainInterest(id, {
        symbol,
        expiration: exp,
        side: viewSide,
        wings,
      });
    }
    let cancelled = false;
    void (async () => {
      const next = new Map<string, GexCalBook>();
      for (const exp of list) {
        try {
          const r = await pollChainLadder({
            symbol,
            expiration: exp,
            side: viewSide,
            wings,
          });
          if (cancelled) return;
          if (r.mode !== "full") continue;
          const ladder = r.ladder as LadderFull;
          next.set(exp, {
            expiration: exp,
            ctx: chainContextFromLadder(symbol, ladder, viewSide),
          });
        } catch {
          /* missing book stays absent — GC3 fail loud */
        }
      }
      if (!cancelled) setBooks(next);
    })();
    return () => {
      cancelled = true;
      for (const id of ids) sock.setChainInterest(id, null);
    };
  }, [enabled, symbol, wings, viewSide, visKey]);

  return {
    symbol,
    wings,
    spot,
    visibleExpirations: vis,
    books,
  };
}
