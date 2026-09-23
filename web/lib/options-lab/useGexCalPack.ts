"use client";

/**
 * Term Mass pack: N listed expirations on the existing MarketSocket
 * (one WS/tab). HTTP hydrate-if-empty, then apply chain full/diff so
 * gex_v1 tiles follow the market. No second Massive client.
 */

import { useEffect, useMemo, useState } from "react";
import { getMarketSocket } from "@/lib/market/MarketSocket";
import type { ChainMessage } from "@/lib/market/types";
import {
  applyLadderDiff,
  pollChainLadder,
  type LadderFull,
  type LadderPollResult,
  type LadderRow,
} from "@/lib/chainLadderApi";
import { chainContextFromLadder } from "@/lib/options-lab/templates/chainContext";
import type { GexCalBook, GexCalPack } from "@/lib/options-lab/templates/gexCal";
import { termMassExpFromChainKey } from "@/lib/options-lab/termMassChainKey";

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

    const writeBook = (exp: string, ladder: LadderFull) => {
      setBooks((prev) => {
        const next = new Map(prev);
        next.set(exp, {
          expiration: exp,
          ctx: chainContextFromLadder(symbol, ladder, viewSide),
        });
        return next;
      });
    };

    const applyPushed = (exp: string, result: LadderPollResult) => {
      setBooks((prev) => {
        const cur = prev.get(exp);
        const rows = cur ? new Map(cur.ctx.contracts) : new Map();
        const { next, meta, hash } = applyLadderDiff(rows, result);
        const copy = new Map(prev);
        copy.set(exp, {
          expiration: exp,
          ctx: {
            symbol,
            viewSide,
            spot:
              meta && "spot" in meta && meta.spot != null
                ? Number(meta.spot)
                : cur?.ctx.spot ?? null,
            strikeStep: cur?.ctx.strikeStep ?? null,
            wings,
            contracts: next,
            asOf:
              (meta && "as_of" in meta && meta.as_of
                ? String(meta.as_of)
                : cur?.ctx.asOf) ?? null,
            contentHash: hash || cur?.ctx.contentHash || null,
          },
        });
        return copy;
      });
    };

    void (async () => {
      for (const exp of list) {
        try {
          const r = await pollChainLadder({
            symbol,
            expiration: exp,
            side: viewSide,
            wings,
          });
          if (cancelled) return;
          if (r.mode === "full") writeBook(exp, r.ladder as LadderFull);
          else if (r.mode === "diff") applyPushed(exp, r);
        } catch {
          /* missing book stays absent — GC3 fail loud */
        }
      }
    })();

    const unsub = sock.subscribe((msg) => {
      if (cancelled) return;
      if (msg.t !== "chain") return;
      const m = msg as ChainMessage & {
        key?: string;
        mode?: string;
        content_hash?: string;
        ladder?: LadderFull;
        upserts?: LadderRow[];
        spot?: number;
        as_of?: string;
        band?: number;
        changed_strike_count?: number;
        removes?: Array<number | string>;
      };
      if (!m.key) return;
      const exp = termMassExpFromChainKey(m.key, symbol, wings);
      if (!exp || !list.includes(exp)) return;
      if (m.mode === "full" && m.ladder) {
        writeBook(exp, m.ladder);
        return;
      }
      if (m.mode === "diff") {
        applyPushed(exp, {
          mode: "diff",
          content_hash: m.content_hash || "",
          as_of: m.as_of,
          spot: Number(m.spot),
          band: m.band,
          upserts: m.upserts || [],
          removes: m.removes || [],
          changed_strike_count: m.changed_strike_count,
        });
      }
    });

    return () => {
      cancelled = true;
      unsub();
      for (const id of ids) sock.setChainInterest(id, null);
    };
  }, [enabled, symbol, wings, viewSide, visKey]);

  const liveBooks = useMemo(() => {
    if (spot == null) return books;
    let changed = false;
    const next = new Map<string, GexCalBook>();
    for (const [k, b] of books) {
      if (b.ctx.spot === spot) {
        next.set(k, b);
      } else {
        changed = true;
        next.set(k, { ...b, ctx: { ...b.ctx, spot } });
      }
    }
    return changed ? next : books;
  }, [books, spot]);

  return {
    symbol,
    wings,
    spot,
    visibleExpirations: vis,
    books: liveBooks,
  };
}
