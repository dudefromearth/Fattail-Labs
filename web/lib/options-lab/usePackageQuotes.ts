/**
 * OPF package quotes for Analyzer cards — **atomic resolve** with open-session
 * market-truth exception.
 *
 * On definition change (expiration / strikes / side / visibility):
 *   1. Resolve once for that definition (hydrate → bind → package quote)
 *   2. Push **one** final card update (built price or named failure)
 *   3. Stop. No further searching until the definition changes again.
 *
 * Exception — **session opens (held → live)**:
 *   Invalidate settles, clear ladder cache, re-hydrate OPF generations, and
 *   re-quote every card until mark_mode is live NBBO (market truth). Chase
 *   continues while any card is still pre_open_* / held after open.
 *
 * The position is an atomic unit: no intermediate flash, no definition poll loop.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  pollChainLadder,
  type LadderFull,
  type LadderRow,
} from "@/lib/chainLadderApi";
import {
  applyPackageQuote,
  cardDefinitionKey,
  cardNeedsMarketTruth,
  definedDebitSigned,
  isOptionPointerExpired,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import {
  applyBindAssessment,
  assessPositionBind,
  bindSnapshotEqual,
} from "@/lib/options-lab/optionBind";
import {
  ladderToOpfGeneration,
  quoteOpfPackage,
  touchOpfInterest,
  tradeToOpfStrategy,
} from "@/lib/options-lab/opfPricingApi";
import { normalizeStrike } from "@/lib/options-lab/listedStrikes";
import {
  positionToParsedTrade,
  positionToUnitInput,
} from "@/lib/options-lab/positionToTrade";
import { packageEconomicsFromLegs } from "@/lib/options-lab/packageEconomics";
import type { OptionRight } from "@/lib/options-lab/positionTypes";

/** Max dual-side wing request (server caps effective dual at 50). */
const WINGS = 100;
/** After open, re-quote cards still on pre-open marks until NBBO lands. */
const MARKET_TRUTH_CHASE_MS = 6_000;
/** Stop chasing open-transition marks after this window (ms). */
const MARKET_TRUTH_CHASE_MAX_MS = 5 * 60_000;

function rowKey(side: string, strike: number): string {
  return `${side.toLowerCase()}:${normalizeStrike(strike)}`;
}

export function usePackageQuotes(opts: {
  positions: AnalyzerPosition[];
  sessionHeld?: boolean;
  enabled?: boolean;
  onUpdate: (id: string, next: AnalyzerPosition) => void;
  /**
   * Chain generation fingerprint from the Analyzer sheet. Unlocked cards
   * re-quote on a new epoch so the price field stays at live mid.
   * Locked cards only refresh lastNat (displayed D* does not move).
   */
  generationEpoch?: string;
  listedExpirations?: readonly string[];
}) {
  const {
    positions,
    sessionHeld = false,
    enabled = true,
    onUpdate,
    generationEpoch,
    listedExpirations = null,
  } = opts;

  const laddersRef = useRef<Map<string, LadderFull>>(new Map());
  const [quoting, setQuoting] = useState(false);

  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const sessionHeldRef = useRef(sessionHeld);
  sessionHeldRef.current = sessionHeld;
  const listedRef = useRef(listedExpirations);
  listedRef.current = listedExpirations;

  /** Last definition key fully settled (success or terminal failure) per card id */
  const settledDefRef = useRef<Map<string, string>>(new Map());
  /** In-flight definition key per card — ignore stale async completions */
  const inFlightDefRef = useRef<Map<string, string>>(new Map());
  /** Monotonic run id to drop cancelled full-book passes */
  const runIdRef = useRef(0);

  const pushUpdate = useCallback((id: string, next: AnalyzerPosition) => {
    const prev = positionsRef.current.find((p) => p.id === id);
    // Card was deleted / no longer in the book — never resurrect it.
    if (!prev) return;
    if (
      prev.liveState === next.liveState &&
      prev.livePackagePerShare === next.livePackagePerShare &&
      prev.lastNatSigned === next.lastNatSigned &&
      (prev.definedDebitPerShare ?? null) ===
        (next.definedDebitPerShare ?? null) &&
      prev.priceSide === next.priceSide &&
      prev.lock.mode === next.lock.mode &&
      prev.displayAsOf === next.displayAsOf &&
      (prev.markMode ?? null) === (next.markMode ?? null) &&
      (prev.markDisclaimer ?? null) === (next.markDisclaimer ?? null) &&
      bindSnapshotEqual(prev.bind, next.bind) &&
      JSON.stringify(prev.contentHashes) === JSON.stringify(next.contentHashes)
    ) {
      return;
    }
    onUpdateRef.current(id, next);
  }, []);

  const hydrateExp = useCallback(
    async (symbol: string, exp: string, opts?: { force?: boolean }) => {
      const key = `${symbol}|${exp}`;
      const prev = opts?.force ? null : laddersRef.current.get(key);
      try {
        const polled = await pollChainLadder({
          expiration: exp,
          symbol,
          wings: WINGS,
          // Force full snapshot on open / market-truth chase — never trust
          // pre-open content_hash as "unchanged" when switching to NBBO.
          since_hash: opts?.force ? null : (prev?.content_hash ?? null),
        });
        let ladder: LadderFull | null = prev ?? null;
        if (polled.mode === "full") ladder = polled.ladder;
        else if (polled.mode === "diff" && prev) {
          const byKey = new Map(
            prev.rows.map((r) => [rowKey(r.side || "call", r.strike), r]),
          );
          for (const u of polled.upserts || []) {
            byKey.set(rowKey(u.side || "call", u.strike), u);
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
        return prev ?? laddersRef.current.get(key) ?? null;
      }
    },
    [],
  );

  const getContractFromLadders = useCallback(
    (
      symbol: string,
      expiration: string,
      strike: number,
      type: OptionRight,
    ) => {
      const lad = laddersRef.current.get(
        `${symbol}|${expiration.slice(0, 10)}`,
      );
      if (!lad) return undefined;
      const k = normalizeStrike(strike);
      const row = lad.rows.find(
        (r: LadderRow) =>
          normalizeStrike(Number(r.strike)) === k &&
          (r.side || "call").toLowerCase() === type,
      );
      if (!row) return undefined;
      return {
        mid: row.mid ?? null,
        bid: row.bid ?? null,
        ask: row.ask ?? null,
      };
    },
    [],
  );

  const getStrikeBand = useCallback((symbol: string, expiration: string) => {
    const lad = laddersRef.current.get(`${symbol}|${expiration.slice(0, 10)}`);
    if (!lad?.rows?.length) return undefined;
    const strikes = [
      ...new Set(
        lad.rows
          .map((r) => normalizeStrike(Number(r.strike)))
          .filter((s) => Number.isFinite(s) && s > 0),
      ),
    ].sort((a, b) => a - b);
    if (!strikes.length) return undefined;
    return {
      lo: strikes[0],
      hi: strikes[strikes.length - 1],
      strikes,
    };
  }, []);

  /**
   * Atomic resolve for one card definition.
   * Exactly one terminal pushUpdate (or none if superseded / already settled).
   */
  /** When true, next resolveOne hydrates with force (full ladder, no since_hash). */
  const forceHydrateRef = useRef(false);

  const resolveOne = useCallback(
    async (pos: AnalyzerPosition) => {
      const def = cardDefinitionKey(pos);
      if (settledDefRef.current.get(pos.id) === def) {
        return; // already settled this definition — do not re-search
      }

      inFlightDefRef.current.set(pos.id, def);
      const stillCurrent = () => inFlightDefRef.current.get(pos.id) === def;
      const held = sessionHeldRef.current;
      const forceHydrate = forceHydrateRef.current;

      const finish = (next: AnalyzerPosition) => {
        if (!stillCurrent()) return;
        settledDefRef.current.set(pos.id, def);
        inFlightDefRef.current.delete(pos.id);
        pushUpdate(pos.id, next);
      };

      if (!pos.visible) {
        finish({
          ...pos,
          liveState: "not_live",
          updatedAt: Date.now(),
        });
        return;
      }

      if (isOptionPointerExpired(pos.position.expiration)) {
        // Dead pointer: keep the defined debit. Off market → last print
        // ladder for that exp, if OPF still holds it, to recover strikes/mids.
        const trade = positionToParsedTrade(pos.position);
        const exp = pos.position.expiration.slice(0, 10);
        if (sessionHeldRef.current) {
          await hydrateExp(trade.symbol, exp);
        }
        if (!stillCurrent()) return;
        let debit = definedDebitSigned(pos);
        if (debit == null) {
          const econ = packageEconomicsFromLegs(
            pos.position.legs,
            (e, s, t) =>
              getContractFromLadders(trade.symbol, e, s, t),
            exp,
            pos.position.contracts,
          );
          if (econ.complete && econ.signedMid != null) {
            // Per-position debit (OPF sign). Total is Qty × this.
            debit = -econ.signedMid; // MSC credit>0 → OPF debit>0
          }
        }
        finish({
          ...pos,
          definedDebitPerShare: debit,
          lastNatSigned: pos.lastNatSigned ?? debit,
          livePackagePerShare:
            debit != null ? Math.abs(debit) : pos.livePackagePerShare,
          priceSide:
            debit == null
              ? pos.priceSide
              : debit < 0
                ? "credit"
                : "debit",
          updatedAt: Date.now(),
        });
        return;
      }

      const trade = positionToParsedTrade(pos.position);
      const exps = [
        ...new Set(
          trade.legs
            .map((l) => l.expiration)
            .concat(trade.expiration)
            .filter(Boolean)
            .map((e) => e.slice(0, 10)),
        ),
      ];

      // Full hydrate before any UI update (force on open → market truth)
      for (const exp of exps) {
        if (!stillCurrent()) return;
        await hydrateExp(trade.symbol, exp, { force: forceHydrate });
      }
      if (!stillCurrent()) return;

      const listed = listedRef.current;
      const bind = assessPositionBind(pos.position, {
        listedExpirations: listed && listed.length ? listed : null,
        getContract: (expiration, strike, type) =>
          getContractFromLadders(trade.symbol, expiration, strike, type),
        getStrikeBand: (expiration) =>
          getStrikeBand(trade.symbol, expiration),
      });

      if (!bind.bindable) {
        finish(applyBindAssessment(pos, bind));
        return;
      }

      const working = applyBindAssessment(pos, bind);
      const gens = [];
      let interestOk = true;

      for (const exp of exps) {
        if (!stillCurrent()) return;
        const lad = laddersRef.current.get(`${trade.symbol}|${exp}`);
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
            finish(applyPackageQuote(working, {}, { interestOk: false }));
            return;
          }
        }
        gens.push(ladderToOpfGeneration(lad, trade.symbol, WINGS));
      }

      if (!stillCurrent()) return;

      if (!gens.length) {
        finish(
          applyPackageQuote(
            working,
            { complete: false, error: "no generations" },
            { sessionHeld: held, interestOk },
          ),
        );
        return;
      }

      try {
        const q = await quoteOpfPackage({
          strategy: {
            ...tradeToOpfStrategy(
              positionToParsedTrade(positionToUnitInput(pos.position)),
            ),
            strategy_id: pos.id,
          },
          generations: gens,
          require_epoch_ok: true,
        });
        if (!stillCurrent()) return;
        finish(
          applyPackageQuote(working, q, { sessionHeld: held, interestOk }),
        );
      } catch (e) {
        if (!stillCurrent()) return;
        finish(
          applyPackageQuote(
            working,
            {
              complete: false,
              error: e instanceof Error ? e.message : String(e),
            },
            { sessionHeld: held, interestOk },
          ),
        );
      }
    },
    [hydrateExp, pushUpdate, getContractFromLadders, getStrikeBand],
  );

  /**
   * Resolve every card whose definition is not yet settled.
   * Does not re-open settled definitions.
   */
  const resolvePending = useCallback(async () => {
    if (!enabled) return;
    const run = ++runIdRef.current;
    const book = positionsRef.current;
    if (!book.length) return;

    const pending = book.filter((p) => {
      const def = cardDefinitionKey(p);
      return settledDefRef.current.get(p.id) !== def;
    });
    if (!pending.length) return;

    setQuoting(true);
    try {
      for (const pos of pending) {
        if (run !== runIdRef.current) return;
        const latest =
          positionsRef.current.find((p) => p.id === pos.id) ?? pos;
        await resolveOne(latest);
      }
    } finally {
      if (run === runIdRef.current) setQuoting(false);
    }
  }, [enabled, resolveOne]);

  // Only definition identity of the book — not live marks, not generation ticks
  const definitionEpoch = positions.map(cardDefinitionKey).join("||");

  // When a card is removed, drop settle/in-flight bookkeeping
  useEffect(() => {
    const ids = new Set(positions.map((p) => p.id));
    for (const id of [...settledDefRef.current.keys()]) {
      if (!ids.has(id)) settledDefRef.current.delete(id);
    }
    for (const id of [...inFlightDefRef.current.keys()]) {
      if (!ids.has(id)) inFlightDefRef.current.delete(id);
    }
  }, [positions]);

  // Atomic resolve only when definitions change (or enable)
  useEffect(() => {
    if (!enabled) return;
    void resolvePending();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- definitionEpoch is the sole trigger
  }, [definitionEpoch, enabled]);

  /**
   * Live mid for unlocked cards. Definition settle stays atomic; this only
   * re-opens cards that already have a package when the held generation moves.
   */
  const lastLiveEpochRef = useRef("");
  useEffect(() => {
    if (!enabled) return;
    const epoch = generationEpoch ?? "";
    if (!epoch || epoch === lastLiveEpochRef.current) return;
    lastLiveEpochRef.current = epoch;
    let need = false;
    for (const p of positionsRef.current) {
      if (!p.visible) continue;
      if (isOptionPointerExpired(p.position.expiration)) continue;
      if (p.bind && !p.bind.bindable) continue;
      if (
        p.liveState === "incomplete" ||
        p.liveState === "budget_refused" ||
        p.liveState === "skewed" ||
        p.liveState === "not_live"
      ) {
        continue;
      }
      settledDefRef.current.delete(p.id);
      need = true;
    }
    if (need) void resolvePending();
  }, [generationEpoch, enabled, resolvePending]);

  // Manual refresh: clear settle flags and re-resolve once
  const refreshAll = useCallback(async () => {
    settledDefRef.current.clear();
    inFlightDefRef.current.clear();
    forceHydrateRef.current = true;
    try {
      await resolvePending();
    } finally {
      forceHydrateRef.current = false;
    }
  }, [resolvePending]);

  /**
   * Market open → market truth: drop pre-open ladder cache + settles, force
   * full OPF hydrate and package re-quote for every card.
   */
  const refreshForMarketOpen = useCallback(async () => {
    laddersRef.current.clear();
    settledDefRef.current.clear();
    inFlightDefRef.current.clear();
    forceHydrateRef.current = true;
    try {
      await resolvePending();
    } finally {
      forceHydrateRef.current = false;
    }
  }, [resolvePending]);

  // Session held → open: OPF + positions must switch to live NBBO
  const prevSessionHeldRef = useRef(sessionHeld);
  useEffect(() => {
    const wasHeld = prevSessionHeldRef.current;
    prevSessionHeldRef.current = sessionHeld;
    if (!enabled) return;
    if (wasHeld && !sessionHeld) {
      void refreshForMarketOpen();
    }
  }, [sessionHeld, enabled, refreshForMarketOpen]);

  /**
   * While session is Live: re-quote any card still on pre_open/held marks until
   * OPF reports live NBBO. Covers open-while-app-open and overnight book hydrate
   * that settled on theo before the bell.
   */
  useEffect(() => {
    if (!enabled || sessionHeld) return;
    // Immediate pass for overnight pre_open book once we know we're Live
    const kick = () => {
      const book = positionsRef.current;
      let need = false;
      for (const p of book) {
        if (!cardNeedsMarketTruth(p)) continue;
        settledDefRef.current.delete(p.id);
        need = true;
      }
      if (!need) return;
      forceHydrateRef.current = true;
      void resolvePending().finally(() => {
        forceHydrateRef.current = false;
      });
    };
    kick();
    const started = Date.now();
    const id = window.setInterval(() => {
      // After max window, still chase but less often is handled by same interval;
      // stop only when no card needs market truth (kick early-returns).
      if (Date.now() - started > MARKET_TRUTH_CHASE_MAX_MS) {
        // Keep chasing indefinitely at this cadence while pre_open remains —
        // better a few quotes than stuck theo · until open after the open.
      }
      kick();
    }, MARKET_TRUTH_CHASE_MS);
    return () => window.clearInterval(id);
  }, [enabled, sessionHeld, resolvePending]);

  return { refreshAll, refreshForMarketOpen, quoting, laddersRef };
}
