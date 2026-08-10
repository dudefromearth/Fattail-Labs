"use client";

/**
 * Vertical chain ladder — data updates in place.
 * Symbol list = Admin market universe (same SoR as /admin symbols).
 * Only strike rows whose mid/bid/ask/vol/oi/greeks/iv actually changed re-render.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  applyLadderDiff,
  fetchLadderExpirations,
  pollChainLadder,
  type LadderExpirationContract,
  type LadderRow,
} from "@/lib/chainLadderApi";
import {
  fetchMarketUniverse,
  type MarketUniverseSymbol,
} from "@/lib/capitalApi";

const POLL_MS = 2000;
/** Next N distinct listed expirations (not calendar days). */
const EXPIRY_PICK_COUNT = 3;

function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

const StrikeRow = memo(function StrikeRow({
  row,
  flash,
}: {
  row: LadderRow;
  flash: boolean;
}) {
  return (
    <tr
      className={
        row.is_spot
          ? "bg-[var(--color-tint)]/20 font-semibold"
          : flash
            ? "bg-amber-500/15 transition-colors duration-500"
            : undefined
      }
      data-strike={row.strike}
      data-spot={row.is_spot ? "1" : "0"}
    >
      <td className="sticky left-0 z-[1] border-b border-[var(--color-separator)] bg-inherit px-2 py-1 text-right tabular-nums">
        {fmt(row.strike, 0)}
        {row.is_spot ? (
          <span className="ml-1 text-[10px] font-bold text-[var(--color-tint)]">
            SPOT
          </span>
        ) : null}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.mid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.bid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.ask)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.volume, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.open_interest, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.delta, 3)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {row.iv != null ? `${(Number(row.iv) * 100).toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
});

export default function ChainLadderPage() {
  const [universe, setUniverse] = useState<MarketUniverseSymbol[]>([]);
  const [symbol, setSymbol] = useState("SPX");
  const [expiryContracts, setExpiryContracts] = useState<
    LadderExpirationContract[]
  >([]);
  const [expiration, setExpiration] = useState("");
  const [side, setSide] = useState<"call" | "put">("call");
  const [sigma, setSigma] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [band, setBand] = useState<number | null>(null);
  const [ladderDte, setLadderDte] = useState<number | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [rowsByStrike, setRowsByStrike] = useState<Map<number, LadderRow>>(
    () => new Map(),
  );
  const [flashStrikes, setFlashStrikes] = useState<Set<number>>(() => new Set());
  const [lastPatch, setLastPatch] = useState<string>("—");
  const hashRef = useRef<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Admin market universe — same list as Admin → Symbols
  useEffect(() => {
    void (async () => {
      try {
        const u = await fetchMarketUniverse({ enabledOnly: true });
        if (!mounted.current) return;
        const syms = u.symbols || [];
        setUniverse(syms);
        if (syms.length) {
          const has = syms.some((s) => s.symbol === symbol);
          if (!has) setSymbol(syms[0].symbol);
        }
      } catch (e) {
        if (mounted.current)
          setError(
            e instanceof Error ? e.message : "Could not load market universe",
          );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Next 3 distinct listed expirations for this symbol (SPX daily, others M/W/F or Fri…)
  useEffect(() => {
    if (!symbol) return;
    setExpiration("");
    setExpiryContracts([]);
    setLadderDte(null);
    void (async () => {
      try {
        const pack = await fetchLadderExpirations(symbol, EXPIRY_PICK_COUNT);
        if (!mounted.current) return;
        setExpiryContracts(pack.contracts);
        const def = pack.default_expiration || pack.contracts[0]?.expiration || "";
        setExpiration(def);
        const dte0 = pack.contracts.find((c) => c.expiration === def)?.dte;
        setLadderDte(dte0 != null ? dte0 : null);
        setError(null);
      } catch (e) {
        if (mounted.current)
          setError(
            e instanceof Error ? e.message : "Could not load expirations",
          );
      }
    })();
  }, [symbol]);

  const tick = useCallback(async () => {
    if (!expiration || !symbol) return;
    try {
      const result = await pollChainLadder({
        expiration,
        symbol,
        side,
        sigma,
        since_hash: hashRef.current,
      });
      if (!mounted.current) return;
      setError(null);

      setRowsByStrike((prev) => {
        const { next, touched, meta, hash: h } = applyLadderDiff(prev, result);
        hashRef.current = h;
        queueMicrotask(() => {
          if (!mounted.current) return;
          setHash(h);
          if (meta?.spot != null) setSpot(Number(meta.spot));
          if (meta?.band != null) setBand(Number(meta.band));
          if (meta?.as_of) setAsOf(String(meta.as_of));
          if (result.mode === "full" && result.ladder.dte != null) {
            setLadderDte(Number(result.ladder.dte));
          }
          if (result.mode === "diff") {
            setLastPatch(
              `${result.changed_strike_count ?? result.upserts.length} strike(s) · ${result.removes.length} removed`,
            );
          } else if (result.mode === "full") {
            setLastPatch(`full ${result.ladder.row_count} rows`);
          } else {
            setLastPatch("no change");
          }
          if (touched.size) {
            const reduceMotion =
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (!reduceMotion) {
              setFlashStrikes(new Set(touched));
              window.setTimeout(() => {
                if (mounted.current) setFlashStrikes(new Set());
              }, 600);
            }
          }
        });
        return next;
      });
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Poll failed");
    }
  }, [expiration, symbol, side, sigma]);

  // Reset hash when controls change so first response is full
  useEffect(() => {
    hashRef.current = null;
    setHash(null);
    setRowsByStrike(new Map());
    setSpot(null);
    setBand(null);
  }, [expiration, symbol, side, sigma]);

  useEffect(() => {
    if (!expiration) return;
    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => window.clearInterval(id);
  }, [expiration, tick]);

  const ordered = useMemo(() => {
    return [...rowsByStrike.values()].sort((a, b) => a.strike - b.strike);
  }, [rowsByStrike]);

  const selectedMeta = universe.find((u) => u.symbol === symbol);
  const selectedExpiry = expiryContracts.find((c) => c.expiration === expiration);
  const displayDte =
    ladderDte != null
      ? ladderDte
      : selectedExpiry != null
        ? selectedExpiry.dte
        : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-3 px-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/app"
          className="text-sm text-[var(--color-label-secondary)] hover:underline"
        >
          ← Apps
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-label)]">
          Options Lab
        </h1>
        <span className="text-xs text-[var(--color-label-tertiary)]">
          {symbol}
          {displayDte != null ? ` · ${displayDte} DTE` : ""}
          {" · "}±{sigma}σ · row diffs only
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-separator)] p-3">
        <label className="text-xs text-[var(--color-label-secondary)]">
          Symbol
          <select
            className="mt-0.5 block min-h-11 min-w-[8rem] rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm font-medium text-[var(--color-label)]"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            data-testid="chain-ladder-symbol"
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
                {u.kind ? ` · ${u.kind}` : ""}
                {u.feed_symbol ? ` (${u.feed_symbol})` : ""}
              </option>
            ))}
          </select>
          {selectedMeta?.feed_symbol && (
            <span className="mt-0.5 block text-[10px] text-[var(--color-label-tertiary)]">
              chain feed {selectedMeta.feed_symbol}
            </span>
          )}
        </label>
        <label className="text-xs text-[var(--color-label-secondary)]">
          Contract (next {EXPIRY_PICK_COUNT} expiries)
          <select
            className="mt-0.5 block min-h-11 min-w-[12rem] rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
            value={expiration}
            onChange={(e) => {
              const v = e.target.value;
              setExpiration(v);
              const c = expiryContracts.find((x) => x.expiration === v);
              setLadderDte(c != null ? c.dte : null);
            }}
            data-testid="chain-ladder-expiration"
          >
            {!expiration && <option value="">—</option>}
            {expiryContracts.map((c) => (
              <option key={c.expiration} value={c.expiration}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="mt-0.5 block text-[10px] text-[var(--color-label-tertiary)]">
            Distinct listed dates for {symbol}
            {displayDte != null ? ` · selected ${displayDte} DTE` : ""}
          </span>
        </label>
        <label className="text-xs text-[var(--color-label-secondary)]">
          Side
          <select
            className="mt-0.5 block min-h-11 rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
            value={side}
            onChange={(e) => setSide(e.target.value as "call" | "put")}
          >
            <option value="call">Calls</option>
            <option value="put">Puts</option>
          </select>
        </label>
        <label className="text-xs text-[var(--color-label-secondary)]">
          Sigma
          <input
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            className="mt-0.5 block h-11 w-20 rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 text-sm"
            value={sigma}
            onChange={(e) => setSigma(Number(e.target.value) || 2)}
          />
        </label>
        <div className="ml-auto text-right text-xs text-[var(--color-label-tertiary)]">
          <div>
            Spot{" "}
            <span className="tabular-nums text-[var(--color-label)]">
              {spot != null ? fmt(spot, 2) : "—"}
            </span>
            {band != null && (
              <span className="ml-2">band ±{fmt(band, 0)}</span>
            )}
          </div>
          <div>hash {hash?.slice(0, 8) || "—"} · {lastPatch}</div>
          <div>{asOf ? `as of ${asOf}` : ""}</div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-[var(--color-separator)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-[2] bg-[var(--color-canvas)] text-left text-[10px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
            <tr>
              <th className="sticky left-0 bg-[var(--color-canvas)] px-2 py-2">
                Strike
              </th>
              <th className="px-2 py-2 text-right">Mid</th>
              <th className="px-2 py-2 text-right">Bid</th>
              <th className="px-2 py-2 text-right">Ask</th>
              <th className="px-2 py-2 text-right">Vol</th>
              <th className="px-2 py-2 text-right">OI</th>
              <th className="px-2 py-2 text-right">Δ</th>
              <th className="px-2 py-2 text-right">IV</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => (
              <StrikeRow
                key={row.strike}
                row={row}
                flash={flashStrikes.has(row.strike)}
              />
            ))}
            {!ordered.length && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-[var(--color-label-tertiary)]"
                >
                  {expiration ? "Waiting for chain…" : "Pick an expiration"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--color-label-tertiary)]">
        Poll every {POLL_MS / 1000}s. Unchanged hash → no row work. Diff mode
        only patches strikes whose price/greeks/vol/oi moved. Not a page
        refresh; not a full-table rewrite.
      </p>
    </main>
  );
}
