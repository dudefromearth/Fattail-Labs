"use client";

/**
 * Heatmap app v1 — options chain ladder (templates later).
 * Symbol from Options Lab suite context.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_STRIKE_WINGS,
  STRIKE_WING_CHOICES,
  fetchLadderExpirations,
  type LadderExpirationContract,
  type LadderRow,
  type StrikeWings,
} from "@/lib/chainLadderApi";
import { useOptionChainBus } from "@/lib/market/useOptionChainBus";
import { useOptionsLab } from "@/lib/optionsLabContext";

const EXPIRY_PICK_COUNT = 3;

function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function fmtStrike(n: number | null | undefined): string {
  if (n == null) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const cents = Math.round(v * 100);
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const wholeStr = String(whole);
  const body =
    frac === 0 ? wholeStr : `${wholeStr}.${String(frac).padStart(2, "0")}`;
  return neg ? `-${body}` : body;
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
      <td
        className="sticky left-0 z-[1] border-b border-[var(--color-separator)] bg-inherit px-2 py-1 text-right tabular-nums"
        title={String(row.strike)}
      >
        {fmtStrike(row.strike)}
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

export default function HeatmapChainPanel() {
  const { symbol, universe } = useOptionsLab();
  const [expiryContracts, setExpiryContracts] = useState<
    LadderExpirationContract[]
  >([]);
  const [expiration, setExpiration] = useState("");
  const [side, setSide] = useState<"call" | "put">("call");
  const [wings, setWings] = useState<StrikeWings>(DEFAULT_STRIKE_WINGS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ladderDte, setLadderDte] = useState<number | null>(null);
  const mounted = useRef(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const presentKeyRef = useRef<string>("");
  const centerOnPresentRef = useRef(true);

  const bus = useOptionChainBus({
    symbol,
    expiration,
    side,
    wings,
    enabled: Boolean(expiration && symbol),
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
        const def =
          pack.default_expiration || pack.contracts[0]?.expiration || "";
        setExpiration(def);
        const dte0 = pack.contracts.find((c) => c.expiration === def)?.dte;
        setLadderDte(dte0 != null ? dte0 : null);
        setLoadError(null);
      } catch (e) {
        if (mounted.current)
          setLoadError(
            e instanceof Error ? e.message : "Could not load expirations",
          );
      }
    })();
  }, [symbol]);

  useEffect(() => {
    const key = `${symbol}|${expiration}|${side}|${wings}`;
    if (presentKeyRef.current !== key) {
      presentKeyRef.current = key;
      centerOnPresentRef.current = true;
    }
  }, [expiration, symbol, side, wings]);

  useEffect(() => {
    if (bus.dte != null) setLadderDte(bus.dte);
  }, [bus.dte]);

  const ordered = useMemo(() => {
    return [...bus.rows.values()].sort((a, b) => b.strike - a.strike);
  }, [bus.rows]);

  const centerSpot = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return false;
    const spotEl = root.querySelector(
      'tr[data-spot="1"]',
    ) as HTMLElement | null;
    if (!spotEl) return false;
    const rootRect = root.getBoundingClientRect();
    const elRect = spotEl.getBoundingClientRect();
    root.scrollTop +=
      elRect.top +
      elRect.height / 2 -
      (rootRect.top + rootRect.height / 2);
    return true;
  }, []);

  useEffect(() => {
    if (!centerOnPresentRef.current || !ordered.length) return;
    if (!ordered.some((r) => r.is_spot)) return;
    const id = window.requestAnimationFrame(() => {
      if (centerSpot()) centerOnPresentRef.current = false;
    });
    return () => window.cancelAnimationFrame(id);
  }, [ordered, centerSpot]);

  const selectedMeta = universe.find((u) => u.symbol === symbol);
  const selectedExpiry = expiryContracts.find(
    (c) => c.expiration === expiration,
  );
  const displayDte =
    ladderDte != null
      ? ladderDte
      : selectedExpiry != null
        ? selectedExpiry.dte
        : null;

  const error = loadError || bus.error;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-separator)] p-3">
        <div className="text-xs text-[var(--color-label-tertiary)]">
          <span className="font-medium text-[var(--color-label)]">{symbol}</span>
          {displayDte != null ? ` · ${displayDte} DTE` : ""}
          {selectedMeta?.feed_symbol
            ? ` · feed ${selectedMeta.feed_symbol}`
            : ""}
          {" · "}±{wings} · {bus.transport}
          <span className="mt-0.5 block text-[10px]">
            Templates (flies, verticals, …) — coming next
          </span>
        </div>
        <label className="text-xs text-[var(--color-label-secondary)]">
          Contract (next {EXPIRY_PICK_COUNT})
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
          Wings
          <select
            className="mt-0.5 block min-h-11 min-w-[7rem] rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
            value={wings}
            onChange={(e) => setWings(Number(e.target.value) as StrikeWings)}
            data-testid="chain-ladder-wings"
          >
            {STRIKE_WING_CHOICES.map((n) => (
              <option key={n} value={n}>
                ±{n} strikes
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="min-h-11 rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm font-medium text-[var(--color-label)]"
          onClick={() => centerSpot()}
          disabled={!ordered.some((r) => r.is_spot)}
          data-testid="chain-ladder-center-spot"
        >
          Center spot
        </button>
        <div className="ml-auto text-right text-xs text-[var(--color-label-tertiary)]">
          <div>
            Spot{" "}
            <span className="tabular-nums text-[var(--color-label)]">
              {bus.spot != null ? fmt(bus.spot, 2) : "—"}
            </span>
          </div>
          <div>
            hash {bus.hash?.slice(0, 8) || "—"} · {bus.lastPatch}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div
        ref={scrollRef}
        className="max-h-[70vh] overflow-auto rounded-lg border border-[var(--color-separator)]"
      >
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
                flash={bus.flashStrikes.has(row.strike)}
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
    </div>
  );
}
