/**
 * OPF-served package quotes for Analyzer cards (PB17).
 * Hydrates dual-side generations per card legs → package-quote API.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  pollChainLadder,
  type LadderFull,
} from "@/lib/chainLadderApi";
import {
  applyPackageQuote,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import {
  ladderToOpfGeneration,
  quoteOpfPackage,
  touchOpfInterest,
  tradeToOpfStrategy,
} from "@/lib/options-lab/opfPricingApi";
import { positionToParsedTrade } from "@/lib/options-lab/positionToTrade";

const WINGS = 50;

export function usePackageQuotes(opts: {
  positions: AnalyzerPosition[];
  sessionHeld?: boolean;
  enabled?: boolean;
  onUpdate: (id: string, next: AnalyzerPosition) => void;
  /** Generation content hash fingerprint of warm ladders — triggers re-quote */
  generationEpoch?: string;
}) {
  const {
    positions,
    sessionHeld = false,
    enabled = true,
    onUpdate,
    generationEpoch = "",
  } = opts;
  const laddersRef = useRef<Map<string, LadderFull>>(new Map());
  const [quoting, setQuoting] = useState(false);
  const tickRef = useRef(0);

  const hydrateExp = useCallback(async (symbol: string, exp: string) => {
    const key = `${symbol}|${exp}`;
    const prev = laddersRef.current.get(key);
    try {
      const polled = await pollChainLadder({
        expiration: exp,
        symbol,
        wings: WINGS,
        since_hash: prev?.content_hash ?? null,
      });
      let ladder: LadderFull | null = prev ?? null;
      if (polled.mode === "full") ladder = polled.ladder;
      else if (polled.mode === "diff" && prev) {
        const byKey = new Map(
          prev.rows.map((r) => [
            `${(r.side || "call").toLowerCase()}:${r.strike}`,
            r,
          ]),
        );
        for (const u of polled.upserts || []) {
          byKey.set(`${(u.side || "call").toLowerCase()}:${u.strike}`, u);
        }
        ladder = {
          ...prev,
          content_hash: polled.content_hash,
          as_of: polled.as_of,
          spot: polled.spot ?? prev.spot,
          rows: [...byKey.values()],
        };
      } else if (polled.mode === "unchanged" && prev) {
        ladder = prev;
      } else if (!ladder) {
        const full = await pollChainLadder({
          expiration: exp,
          symbol,
          wings: WINGS,
        });
        if (full.mode === "full") ladder = full.ladder;
      }
      if (ladder) laddersRef.current.set(key, ladder);
      return ladder;
    } catch {
      return prev ?? null;
    }
  }, []);

  const quoteOne = useCallback(
    async (pos: AnalyzerPosition) => {
      if (!pos.visible) {
        onUpdate(pos.id, applyPackageQuote(pos, {}, { interestOk: true }));
        return;
      }
      const trade = positionToParsedTrade(pos.position);
      const exps = [
        ...new Set(trade.legs.map((l) => l.expiration).concat(trade.expiration)),
      ];
      const gens = [];
      let interestOk = true;
      for (const exp of exps) {
        const lad = await hydrateExp(trade.symbol, exp);
        if (!lad) continue;
        const ul = lad.underlier || trade.symbol;
        try {
          await touchOpfInterest({
            chain_underlier: ul,
            expiration: exp,
            wings: WINGS,
            action: "touch",
          });
        } catch (e) {
          if ((e as { budget?: boolean })?.budget) {
            interestOk = false;
            onUpdate(
              pos.id,
              applyPackageQuote(pos, {}, { interestOk: false }),
            );
            return;
          }
        }
        gens.push(ladderToOpfGeneration(lad, trade.symbol, WINGS));
      }
      if (!gens.length) {
        onUpdate(
          pos.id,
          applyPackageQuote(
            pos,
            { complete: false, error: "no generations" },
            { sessionHeld, interestOk },
          ),
        );
        return;
      }
      try {
        const q = await quoteOpfPackage({
          strategy: {
            ...tradeToOpfStrategy(trade),
            strategy_id: pos.id,
          },
          generations: gens,
          require_epoch_ok: true,
        });
        onUpdate(pos.id, applyPackageQuote(pos, q, { sessionHeld, interestOk }));
      } catch (e) {
        onUpdate(
          pos.id,
          applyPackageQuote(
            pos,
            {
              complete: false,
              error: e instanceof Error ? e.message : String(e),
            },
            { sessionHeld, interestOk },
          ),
        );
      }
    },
    [hydrateExp, onUpdate, sessionHeld],
  );

  const refreshAll = useCallback(async () => {
    if (!enabled) return;
    const tick = ++tickRef.current;
    setQuoting(true);
    try {
      for (const pos of positions) {
        if (tick !== tickRef.current) return;
        await quoteOne(pos);
      }
    } finally {
      if (tick === tickRef.current) setQuoting(false);
    }
  }, [enabled, positions, quoteOne]);

  useEffect(() => {
    void refreshAll();
  }, [generationEpoch, positions.map((p) => `${p.id}:${p.visible}:${p.lock.mode}`).join("|"), enabled]);

  return { refreshAll, quoting, laddersRef };
}
