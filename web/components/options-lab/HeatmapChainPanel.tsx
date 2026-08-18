"use client";

/**
 * Heatmap app v1 — options chain ladder (templates later).
 * Layout: left control rail ~1/5 · right chain ~4/5 · full remaining viewport height.
 * Apple HIG: surface cards, segmented controls, token chrome (HIS v1.0).
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
import {
  useSmoothNumber,
  useSmoothNumberMap,
} from "@/lib/useSmoothValue";
import {
  DEFAULT_HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATES,
  getTemplate,
  buildGrid,
} from "@/lib/options-lab/templates/registry";
import { flyWidthsFromProfile } from "@/lib/market/symbolProfile";
import {
  BW_STRIKE_COUNT_CHOICES,
  BW_STRIKE_COUNT_DEFAULT,
  BW_WING_SIDE_DEFAULT,
} from "@/lib/options-lab/templates/bwFly";
import { DEFAULT_GRADIENT_THRESHOLD } from "@/lib/options-lab/templates/color";
import { rememberTosScript } from "@/lib/tradeLogTos";
import {
  buildGexProfile,
  fmtGexProfile,
  gexProfileScale,
} from "@/lib/options-lab/templates/gex";
import { symFlyTemplate } from "@/lib/options-lab/templates/symFly";
import {
  FlySurfacePipeline,
  type FlyPipelinePaint,
} from "@/lib/options-lab/templates/flySurfacePipeline";
import type {
  BwWingSide,
  ChainContext,
  TemplateParams,
  ValueModeId,
} from "@/lib/options-lab/templates/types";
import { isUsEquityRthOpenByClock } from "@/lib/market/usEquitySession";
import {
  generateTosScript,
  bwFlyTosLegs,
  symFlyTosLegs,
} from "@/lib/options-lab/tosGenerator";
import {
  bwFlyDebit,
  resolveBwWings,
  symFlyDebit,
} from "@/lib/options-lab/templates/pricing";
import { saveAnalyzerTrade } from "@/lib/options-lab/analyzerTrade";
import HeatmapControlsColumn from "@/components/options-lab/HeatmapControlsColumn";

const EXPIRY_PICK_COUNT = 3;

const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] transition-colors " +
  "hover:bg-[var(--color-fill)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
  "disabled:pointer-events-none disabled:opacity-45";

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

/** Darken rgb()/hex for selected matrix tile. */
function darkenCssColor(css: string | undefined, factor = 0.55): string {
  const base = css || "#1a1a1a";
  const m = base.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/i,
  );
  if (m) {
    const r = Math.round(Number(m[1]) * factor);
    const g = Math.round(Number(m[2]) * factor);
    const b = Math.round(Number(m[3]) * factor);
    return `rgb(${r},${g},${b})`;
  }
  if (base.startsWith("#") && (base.length === 7 || base.length === 4)) {
    const hex =
      base.length === 4
        ? `#${base[1]}${base[1]}${base[2]}${base[2]}${base[3]}${base[3]}`
        : base;
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${r},${g},${b})`;
  }
  return base;
}

type MatrixTileKey = { strike: number; colId: string };

const StrikeRow = memo(function StrikeRow({
  row,
  flash,
}: {
  row: LadderRow;
  flash: boolean;
}) {
  const rowBg = row.is_spot
    ? "bg-[var(--color-tint)]/15"
    : flash
      ? "bg-[var(--color-fill)] motion-safe:transition-colors motion-safe:duration-500"
      : "bg-[var(--color-surface)]";

  return (
    <tr
      className={[
        rowBg,
        row.is_spot ? "font-semibold" : "",
        "text-[var(--color-label)]",
      ].join(" ")}
      data-strike={row.strike}
      data-spot={row.is_spot ? "1" : "0"}
    >
      <td
        className={[
          "sticky left-0 z-[1] border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums",
          rowBg,
        ].join(" ")}
        title={String(row.strike)}
      >
        <span className="inline-flex items-center justify-end gap-1.5">
          {fmtStrike(row.strike)}
          {row.is_spot ? (
            <span
              className="inline-flex items-center rounded-full bg-[var(--color-tint)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              aria-label="Spot strike"
            >
              Spot
            </span>
          ) : null}
        </span>
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums">
        {fmt(row.mid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.bid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.ask)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.volume, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.open_interest, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums">
        {fmt(row.delta, 3)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums">
        {row.iv != null ? `${(Number(row.iv) * 100).toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
});

export default function HeatmapChainPanel() {
  const { symbol, setSymbol, universe, profile, loading: universeLoading } =
    useOptionsLab();
  const [expiryContracts, setExpiryContracts] = useState<
    LadderExpirationContract[]
  >([]);
  const [expiration, setExpiration] = useState("");
  const [side, setSide] = useState<"call" | "put">("call");
  const [wings, setWings] = useState<StrikeWings>(DEFAULT_STRIKE_WINGS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ladderDte, setLadderDte] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState(DEFAULT_HEATMAP_TEMPLATE_ID);
  const [valueMode, setValueMode] = useState<ValueModeId>(
    () => getTemplate(DEFAULT_HEATMAP_TEMPLATE_ID).defaultValueMode,
  );
  const [stickyScale, setStickyScale] = useState<number | undefined>(undefined);
  /** bw-fly: N listed strikes from body for the broken wing */
  const [bwStrikeCount, setBwStrikeCount] = useState(BW_STRIKE_COUNT_DEFAULT);
  /** bw-fly: place broken wing closest to spot or furthest */
  const [bwWingSide, setBwWingSide] = useState<BwWingSide>(BW_WING_SIDE_DEFAULT);
  const [selectedTile, setSelectedTile] = useState<MatrixTileKey | null>(null);
  const [tosScript, setTosScript] = useState<string>("");
  const [tosCopied, setTosCopied] = useState(false);
  const mounted = useRef(true);

  // Apply per-symbol profile when product changes (wings, side, template defaults)
  useEffect(() => {
    if (!profile?.symbol) return;
    const w = profile.default_wings;
    if (
      STRIKE_WING_CHOICES.includes(w as StrikeWings) ||
      (w >= 5 && w <= 50)
    ) {
      const allowed = [...STRIKE_WING_CHOICES];
      const nearest = allowed.reduce((a, b) =>
        Math.abs(b - w) < Math.abs(a - w) ? b : a,
      );
      setWings(nearest as StrikeWings);
    }
    if (profile.default_view_side === "call" || profile.default_view_side === "put") {
      setSide(profile.default_view_side);
    }
    if (
      profile.heatmap_default_template &&
      HEATMAP_TEMPLATES.some((t) => t.id === profile.heatmap_default_template)
    ) {
      setTemplateId(profile.heatmap_default_template);
    }
  }, [profile.symbol]); // only on symbol identity change
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const presentKeyRef = useRef<string>("");
  const centerOnPresentRef = useRef(true);
  /** AF10 — track market-plane Live transition for history seam */
  const prevSessionOpenRef = useRef<boolean | null>(null);
  /** Single pipeline instance — destroyed on plane change */
  const flyPipeRef = useRef<FlySurfacePipeline | null>(null);
  /** Lightweight paint for active mode only (never store all 11 mode grids). */
  const [flyPaint, setFlyPaint] = useState<FlyPipelinePaint | null>(null);
  const lastIngestKeyRef = useRef("");
  const genReceivedAtRef = useRef<{ key: string; at: number }>({
    key: "",
    at: 0,
  });
  /** rAF coalesce — at most one ingest per frame */
  const ingestRafRef = useRef(0);

  const bus = useOptionChainBus({
    symbol,
    expiration,
    side,
    wings,
    enabled: Boolean(expiration && symbol),
  });

  const tpl = getTemplate(templateId);

  // AF10 / AF11 — dispose pipeline memory on plane change
  useEffect(() => {
    flyPipeRef.current?.seam();
    flyPipeRef.current = null;
    setFlyPaint(null);
    lastIngestKeyRef.current = "";
  }, [symbol, expiration, wings]);

  useEffect(() => {
    const open = bus.sessionOpen;
    const prev = prevSessionOpenRef.current;
    prevSessionOpenRef.current = open;
    if (prev === false && open === true) {
      flyPipeRef.current?.seam();
      lastIngestKeyRef.current = "";
    }
  }, [bus.sessionOpen]);

  useEffect(() => {
    setValueMode(tpl.defaultValueMode);
    setStickyScale(undefined);
    setSelectedTile(null);
  }, [templateId, tpl.defaultValueMode]);

  useEffect(() => {
    setSelectedTile(null);
  }, [symbol, expiration, side, wings, valueMode, bwStrikeCount, bwWingSide]);

  // Leave fly template → free pipeline
  useEffect(() => {
    if (templateId === "sym-fly") return;
    flyPipeRef.current?.seam();
    flyPipeRef.current = null;
    setFlyPaint(null);
    lastIngestKeyRef.current = "";
  }, [templateId]);

  useEffect(() => {
    return () => {
      if (ingestRafRef.current) cancelAnimationFrame(ingestRafRef.current);
      flyPipeRef.current?.seam();
      flyPipeRef.current = null;
    };
  }, []);

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
    let cancelled = false;
    const loadExpiries = async () => {
      try {
        const pack = await fetchLadderExpirations(symbol, EXPIRY_PICK_COUNT);
        if (cancelled || !mounted.current) return;
        setExpiryContracts(pack.contracts);
        // Prefer server default (skips 0DTE after RTH close). Client clock
        // is a safety net if an older API still returns expired 0DTE first.
        let def =
          pack.default_expiration || pack.contracts[0]?.expiration || "";
        const sessionOpen = isUsEquityRthOpenByClock();
        if (!sessionOpen && pack.contracts.length) {
          const first = pack.contracts.find((c) => c.expiration === def);
          if (first && first.dte === 0) {
            const next = pack.contracts.find((c) => c.dte > 0);
            if (next) def = next.expiration;
          }
        }
        setExpiration(def);
        const dte0 = pack.contracts.find((c) => c.expiration === def)?.dte;
        setLadderDte(dte0 != null ? dte0 : null);
        setLoadError(null);
      } catch (e) {
        if (!cancelled && mounted.current)
          setLoadError(
            e instanceof Error ? e.message : "Could not load expirations",
          );
      }
    };
    void loadExpiries();
    return () => {
      cancelled = true;
    };
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

  const chainCtx: ChainContext = useMemo(
    () => ({
      symbol,
      viewSide: side,
      spot: bus.spot,
      strikeStep: bus.strikeStep,
      wings,
      contracts: bus.contracts,
      asOf: bus.asOf,
      contentHash: bus.hash,
    }),
    [
      symbol,
      side,
      bus.spot,
      bus.strikeStep,
      wings,
      bus.contracts,
      bus.asOf,
      bus.hash,
    ],
  );

  const copyTosForFly = useCallback(
    async (body: number, widthPts: number) => {
      if (!expiration) return;
      const shortFly = valueMode === "credit";
      let cost: number | null = null;
      let legs;
      if (templateId === "bw-fly") {
        const wings = resolveBwWings(
          chainCtx,
          body,
          widthPts,
          bwStrikeCount,
          bwWingSide,
        );
        if (!wings) return;
        const d = bwFlyDebit(chainCtx, body, wings.lo, wings.hi);
        cost = d != null && Number.isFinite(d) ? Math.abs(d) : null;
        legs = bwFlyTosLegs({
          lo: wings.lo,
          body,
          hi: wings.hi,
          expiration,
          side,
          short: shortFly,
        });
      } else {
        // Always price from mid debit (structure cost), not RoC / R:R display modes
        const d = symFlyDebit(chainCtx, body, widthPts);
        cost = d != null && Number.isFinite(d) ? Math.abs(d) : null;
        legs = symFlyTosLegs({
          body,
          widthPts,
          expiration,
          side,
          short: shortFly,
        });
      }
      const script = generateTosScript({
        symbol,
        legs,
        costBasis: cost,
      });
      setTosScript(script);
      setSelectedTile({ strike: body, colId: `w${widthPts}` });
      // Hand off to Analyzer (session) — same line as clipboard
      saveAnalyzerTrade(script, "heatmap");
      rememberTosScript(script);
      try {
        await navigator.clipboard.writeText(script);
        setTosCopied(true);
        window.setTimeout(() => setTosCopied(false), 1600);
      } catch {
        setTosCopied(false);
      }
    },
    [
      chainCtx,
      expiration,
      side,
      symbol,
      valueMode,
      templateId,
      bwStrikeCount,
      bwWingSide,
    ],
  );

  /** From Admin/symbol profile; live chain step refines step_multiples. */
  const flyWidths = useMemo(
    () =>
      flyWidthsFromProfile(
        profile,
        chainCtx.strikeStep ?? bus.strikeStep ?? profile.strike_step,
      ),
    [profile, chainCtx.strikeStep, bus.strikeStep],
  );

  const genKey = `${bus.hash ?? ""}|${side}|${valueMode}`;
  if (bus.hash && genReceivedAtRef.current.key !== (bus.hash || "")) {
    genReceivedAtRef.current = {
      key: bus.hash || "",
      at: Date.now(),
    };
  }

  /**
   * Advanced Fly: ingest only when content_hash / mode / side / widths change.
   * One mode only · rAF coalesce · skip if key unchanged.
   */
  useEffect(() => {
    if (templateId !== "sym-fly") return;
    if (!bus.hash || !chainCtx.contracts.size) return;

    const ingestKey = `${bus.hash}|${side}|${valueMode}|${flyWidths.join(",")}`;
    if (ingestKey === lastIngestKeyRef.current) return;

    if (ingestRafRef.current) cancelAnimationFrame(ingestRafRef.current);
    const hashAtSchedule = bus.hash;
    const modeAtSchedule = valueMode;
    ingestRafRef.current = requestAnimationFrame(() => {
      ingestRafRef.current = 0;
      // Drop stale frame if hash moved again
      if (bus.hash !== hashAtSchedule) return;
      if (!flyPipeRef.current) flyPipeRef.current = new FlySurfacePipeline();
      const paint = flyPipeRef.current.ingest(
        chainCtx,
        modeAtSchedule,
        flyWidths,
        { receivedAt: genReceivedAtRef.current.at || Date.now() },
      );
      symFlyTemplate.assignColors(paint.cells, {
        valueMode: modeAtSchedule,
        widthMode: "fixed_points",
        fixedPoints: flyWidths,
        stickyScale,
        gradientThreshold: DEFAULT_GRADIENT_THRESHOLD,
      });
      lastIngestKeyRef.current = `${hashAtSchedule}|${side}|${modeAtSchedule}|${flyWidths.join(",")}`;
      setFlyPaint(paint);
    });

    return () => {
      if (ingestRafRef.current) cancelAnimationFrame(ingestRafRef.current);
    };
    // Intentionally NOT depending on full chainCtx identity — hash is the gen gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chainCtx read inside when hash changes
  }, [templateId, bus.hash, side, valueMode, flyWidths, stickyScale]);

  const templateParams: TemplateParams = useMemo(
    () => ({
      valueMode,
      widthMode: "fixed_points",
      fixedPoints: flyWidths,
      stickyScale,
      gradientThreshold: DEFAULT_GRADIENT_THRESHOLD,
      bwStrikeCount,
      bwWingSide,
    }),
    [valueMode, stickyScale, bwStrikeCount, bwWingSide, flyWidths],
  );

  const matrix = useMemo(() => {
    if (tpl.layout !== "matrix") return null;
    if (tpl.id === "sym-fly") {
      if (!flyPaint || flyPaint.mode !== valueMode) return null;
      return {
        rows: flyPaint.rows,
        cols: flyPaint.cols,
        cells: flyPaint.cells,
        stickyScale: stickyScale ?? DEFAULT_GRADIENT_THRESHOLD,
      };
    }
    return buildGrid(tpl, chainCtx, templateParams);
  }, [tpl, chainCtx, templateParams, flyPaint, valueMode, stickyScale]);
  const gexProfile = useMemo(() => {
    if (tpl.layout !== "profile" || tpl.id !== "gex") return null;
    const points = buildGexProfile(chainCtx, valueMode);
    const scale = gexProfileScale(points, valueMode);
    return { points, scale };
  }, [tpl.layout, tpl.id, chainCtx, valueMode]);

  /** Live spot — ease between bus updates instead of hard jump */
  const smoothSpot = useSmoothNumber(bus.spot, { durationMs: 420 });

  /** GEX magnitudes → animate bar widths / labels */
  const gexAnimKey = useMemo(() => {
    if (!gexProfile) return "";
    return (
      gexProfile.points
        .map(
          (p) =>
            `${p.strike}:${p.call ?? ""}:${p.put ?? ""}:${p.value ?? ""}`,
        )
        .join("|") + `|s${gexProfile.scale}`
    );
  }, [gexProfile]);

  const gexTargets = useMemo(() => {
    const m: Record<string, number> = {};
    if (!gexProfile) return m;
    for (const pt of gexProfile.points) {
      if (pt.call != null) m[`${pt.strike}:c`] = Math.abs(pt.call);
      if (pt.put != null) m[`${pt.strike}:p`] = Math.abs(pt.put);
      if (pt.value != null) m[`${pt.strike}:v`] = pt.value;
    }
    m.__scale = gexProfile.scale || 1;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gexAnimKey fingerprints profile
  }, [gexAnimKey]);

  const smoothGex = useSmoothNumberMap(gexTargets, {
    durationMs: 420,
    startAtZero: true,
  });
  const smoothGexScale = Math.max(1e-12, smoothGex.__scale ?? gexProfile?.scale ?? 1);

  const hasSpotRow = useMemo(() => {
    if (gexProfile?.points.some((p) => p.isSpot)) return true;
    return ordered.some((r) => r.is_spot);
  }, [gexProfile, ordered]);

  useEffect(() => {
    if (matrix?.stickyScale == null) return;
    setStickyScale((prev) =>
      prev != null && Math.abs(prev - matrix.stickyScale) < 1e-12
        ? prev
        : matrix.stickyScale,
    );
  }, [matrix?.stickyScale]);

  const centerSpot = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return false;
    const spotEl = root.querySelector(
      '[data-spot="1"]',
    ) as HTMLElement | null;
    if (!spotEl) return false;
    const rootRect = root.getBoundingClientRect();
    const elRect = spotEl.getBoundingClientRect();
    root.scrollTop +=
      elRect.top + elRect.height / 2 - (rootRect.top + rootRect.height / 2);
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
  const streaming = bus.transport === "stream";
  const held = bus.transport === "held";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:flex-row"
      data-testid="options-lab-heatmap-panel"
    >
      <HeatmapControlsColumn
        streaming={streaming}
        held={held}
        transport={bus.transport}
        error={error}
        symbol={symbol}
        universe={universe}
        universeLoading={universeLoading}
        onSymbolChange={setSymbol}
        templateId={templateId}
        tpl={tpl}
        onTemplateChange={setTemplateId}
        valueMode={valueMode}
        onValueModeChange={setValueMode}
        bwStrikeCount={bwStrikeCount}
        onBwStrikeCountChange={setBwStrikeCount}
        bwWingSide={bwWingSide}
        onBwWingSideChange={setBwWingSide}
        profileLine={
          `Profile · wings ±${profile.default_wings}` +
          (profile.strike_step != null ? ` · step ${profile.strike_step}` : "") +
          ` · widths ${flyWidths[0]}–${flyWidths[flyWidths.length - 1]}` +
          (profile.kind ? ` · ${profile.kind}` : "")
        }
        expiration={expiration}
        expiryContracts={expiryContracts}
        onExpirationChange={(v) => {
          setExpiration(v);
          const c = expiryContracts.find((x) => x.expiration === v);
          setLadderDte(c != null ? c.dte : null);
        }}
        side={side}
        onSideChange={setSide}
        wings={wings}
        onWingsChange={setWings}
        onCenterSpot={() => {
          centerSpot();
        }}
        hasSpotRow={hasSpotRow}
        tosScript={tosScript}
        tosCopied={tosCopied}
        onCopyTos={() => {
          rememberTosScript(tosScript);
          void navigator.clipboard.writeText(tosScript).then(() => {
            setTosCopied(true);
            window.setTimeout(() => setTosCopied(false), 1600);
          });
        }}
        onOpenAnalyzer={() => saveAnalyzerTrade(tosScript, "heatmap")}
        spotLabel={smoothSpot != null ? fmt(smoothSpot, 2) : "—"}
        genLine={bus.hash ? `gen ${bus.hash.slice(0, 8)}` : null}
        dteLine={displayDte != null ? `${displayDte} DTE` : null}
        feedLine={
          selectedMeta?.feed_symbol ? `Feed ${selectedMeta.feed_symbol}` : null
        }
        patchLine={
          bus.lastPatch && bus.lastPatch !== "—" ? bus.lastPatch : null
        }
      />

      {/* Right ~4/5 — contained panel with header */}
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-canvas)] p-2 sm:p-3"
        aria-label="Heatmap view"
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2,0_4px_16px_rgba(0,0,0,0.18))]"
          data-testid="heatmap-view-panel"
        >
          {/* Panel header */}
          <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h3
                  className="truncate font-semibold tracking-tight text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline, 1.0625rem)" }}
                >
                  {tpl.label}
                </h3>
                {tpl.valueModes.length > 1 ? (
                  <span className="text-xs font-medium text-[var(--color-label-secondary)]">
                    ·{" "}
                    {tpl.valueModes.find((m) => m.id === valueMode)?.label ??
                      valueMode}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-[var(--color-label-tertiary)]">
                {[
                  symbol || null,
                  side === "call" ? "Calls" : "Puts",
                  expiration || null,
                  displayDte != null ? `${displayDte} DTE` : null,
                  tpl.layout === "matrix"
                    ? templateId === "bw-fly"
                      ? `Equal ${flyWidths[0]}–${flyWidths[flyWidths.length - 1]} · break ${bwStrikeCount}stk ${bwWingSide}`
                      : `Width ${flyWidths[0]}–${flyWidths[flyWidths.length - 1]}`
                    : tpl.layout === "profile"
                      ? "Vertical profile"
                      : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-label-secondary)]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-label)]">
                <span
                  className={[
                    "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                    streaming
                      ? "bg-[var(--color-tint)]"
                      : held
                        ? "bg-amber-500"
                        : "bg-[var(--color-label-tertiary)]",
                  ].join(" ")}
                  aria-hidden
                />
                {streaming
                  ? "Live"
                  : held
                    ? "Held"
                    : bus.transport === "error"
                      ? "Error"
                      : "…"}
              </span>
              <span className="tabular-nums">
                Spot{" "}
                <span className="font-semibold text-[var(--color-label)]">
                  {smoothSpot != null ? fmt(smoothSpot, 2) : "—"}
                </span>
              </span>
              {bus.hash ? (
                <span
                  className="hidden tabular-nums text-[var(--color-label-tertiary)] sm:inline"
                  title={bus.hash}
                >
                  gen {bus.hash.slice(0, 8)}
                </span>
              ) : null}
              <button
                type="button"
                className={
                  secondaryBtn +
                  " min-h-9 px-3 py-1 text-xs " +
                  (!hasSpotRow ? "pointer-events-none opacity-45" : "")
                }
                onClick={() => centerSpot()}
                disabled={!hasSpotRow}
                data-testid="chain-ladder-center-spot-panel"
              >
                Center spot
              </button>
            </div>
          </header>

          {/* Panel body — scrollable grid / profile */}
          <div
            ref={scrollRef}
            className={[
              "min-h-0 flex-1 overflow-auto",
              tpl.layout === "matrix" || tpl.layout === "profile"
                ? "bg-[#0a0a0e]"
                : "bg-[var(--color-surface)]",
            ].join(" ")}
          >
            {tpl.layout === "profile" && gexProfile ? (
              /* Vertical GEX: combined Call/Put dual bars, or Net / Abs single series */
              <div
                className="flex min-h-full flex-col text-[13px]"
                data-testid="heatmap-gex-profile"
              >
                <div className="sticky top-0 z-[2] flex h-9 items-center border-b border-white/10 bg-[#0a0a0e]/95 px-2 text-[11px] font-medium uppercase tracking-wide text-white/45 backdrop-blur-sm">
                  <span className="w-20 shrink-0 text-right tabular-nums">
                    Strike
                  </span>
                  <span className="mx-2 flex-1 text-center normal-case tracking-normal">
                    {valueMode === "gex_abs" ? (
                      <span className="text-sky-400/90">Absolute GEX →</span>
                    ) : valueMode === "gex_net" ? (
                      <span className="text-emerald-400/90">
                        ← Neg · Net · Pos →
                      </span>
                    ) : (
                      <span>
                        <span className="text-red-400/90">← Puts</span>
                        <span className="text-white/35"> · </span>
                        <span className="text-sky-400/90">Calls →</span>
                      </span>
                    )}
                  </span>
                  <span className="w-[4.5rem] shrink-0 text-right tabular-nums">
                    {valueMode === "gex_all" ||
                    valueMode === "gex_call" ||
                    valueMode === "gex_put"
                      ? "C / P"
                      : "Value"}
                  </span>
                </div>
                {gexProfile.points.map((pt) => {
                  const scale = smoothGexScale;
                  const combined =
                    valueMode === "gex_all" ||
                    valueMode === "gex_call" ||
                    valueMode === "gex_put";

                  // Animated magnitudes (lerp toward live GEX)
                  const callMag =
                    pt.call != null
                      ? (smoothGex[`${pt.strike}:c`] ?? Math.abs(pt.call))
                      : null;
                  const putMag =
                    pt.put != null
                      ? (smoothGex[`${pt.strike}:p`] ?? Math.abs(pt.put))
                      : null;
                  const callPct =
                    callMag != null
                      ? `${(Math.min(1, callMag / scale) * 50).toFixed(2)}%`
                      : "0%";
                  const putPct =
                    putMag != null
                      ? `${(Math.min(1, putMag / scale) * 50).toFixed(2)}%`
                      : "0%";

                  // Net / Abs single bar (value signed; abs mode uses magnitude)
                  const seriesRaw =
                    pt.valid && pt.value != null
                      ? (smoothGex[`${pt.strike}:v`] ?? pt.value)
                      : 0;
                  const seriesSigned =
                    valueMode === "gex_abs" ? Math.abs(seriesRaw) : seriesRaw;
                  const seriesFrac = Math.min(
                    1,
                    Math.abs(seriesSigned) / scale,
                  );
                  const seriesPct = `${(seriesFrac * 50).toFixed(2)}%`;
                  const seriesNeg = seriesSigned < 0;
                  const seriesPos = seriesSigned > 0;

                  const tip = combined
                    ? [
                        `Strike ${pt.label}`,
                        pt.call != null
                          ? `Call ${fmtGexProfile(pt.call)}`
                          : "Call —",
                        pt.put != null
                          ? `Put ${fmtGexProfile(pt.put)}`
                          : "Put —",
                        pt.value != null
                          ? `Net ${fmtGexProfile(pt.value)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : pt.valid && pt.value != null
                      ? `${pt.label}: ${fmtGexProfile(pt.value)} (÷1e9)`
                      : `${pt.label}: missing γ/OI`;

                  return (
                    <div
                      key={pt.strike}
                      data-spot={pt.isSpot ? "1" : "0"}
                      className={[
                        "flex h-8 items-center border-b border-white/[0.04] px-2",
                        pt.isSpot
                          ? "border-t border-amber-400/70 bg-amber-400/5"
                          : "",
                      ].join(" ")}
                      title={tip}
                    >
                      <span
                        className={[
                          "w-20 shrink-0 text-right tabular-nums font-medium",
                          pt.isSpot
                            ? "font-bold text-amber-400"
                            : "text-white/50",
                        ].join(" ")}
                      >
                        {pt.label}
                      </span>
                      <div className="relative mx-2 h-5 flex-1 overflow-hidden rounded-sm bg-white/[0.04]">
                        <div
                          className="absolute inset-y-0 left-1/2 w-px bg-white/25"
                          aria-hidden
                        />
                        {combined ? (
                          <>
                            {/* Put → left (red) */}
                            {putMag != null && putMag > 0 ? (
                              <div
                                className="absolute top-0.5 bottom-0.5 rounded-sm bg-red-500/85 motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
                                style={{ right: "50%", width: putPct }}
                              />
                            ) : null}
                            {/* Call → right (blue) */}
                            {callMag != null && callMag > 0 ? (
                              <div
                                className="absolute top-0.5 bottom-0.5 rounded-sm bg-sky-500/85 motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
                                style={{ left: "50%", width: callPct }}
                              />
                            ) : null}
                          </>
                        ) : pt.valid && (seriesPos || seriesNeg) ? (
                          <div
                            className={[
                              "absolute top-0.5 bottom-0.5 rounded-sm motion-safe:transition-[width,left,right] motion-safe:duration-300 motion-safe:ease-out",
                              valueMode === "gex_abs"
                                ? "bg-sky-500/90"
                                : seriesNeg
                                  ? "bg-red-500/85"
                                  : "bg-sky-500/85",
                            ].join(" ")}
                            style={
                              seriesNeg
                                ? { right: "50%", width: seriesPct }
                                : { left: "50%", width: seriesPct }
                            }
                          />
                        ) : null}
                      </div>
                      <span className="w-[4.5rem] shrink-0 text-right tabular-nums text-[11px] leading-tight">
                        {combined ? (
                          <>
                            <span className="text-sky-400">
                              {callMag != null ? fmtGexProfile(callMag) : "—"}
                            </span>
                            <span className="text-white/30">/</span>
                            <span className="text-red-400">
                              {putMag != null ? fmtGexProfile(putMag) : "—"}
                            </span>
                          </>
                        ) : (
                          <span
                            className={
                              !pt.valid
                                ? "text-white/25"
                                : seriesNeg
                                  ? "text-red-400"
                                  : "text-sky-400"
                            }
                          >
                            {pt.valid && pt.value != null
                              ? fmtGexProfile(seriesRaw)
                              : "—"}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {!gexProfile.points.length && (
                  <div className="px-4 py-24 text-center text-white/40">
                    {expiration
                      ? "Waiting for dual-side chain (γ / OI)…"
                      : "Choose a contract"}
                  </div>
                )}
              </div>
            ) : tpl.layout === "matrix" && matrix ? (
              /* Symmetric flies matrix: 2× type vs MSC 12/10px baseline */
              <table className="w-full min-w-[40rem] border-collapse text-[24px] leading-none">
                <thead className="sticky top-0 z-[2] bg-[#0a0a0e]/90 backdrop-blur-sm">
                  <tr className="h-14 border-b border-white/10">
                    <th
                      scope="col"
                      className="sticky left-0 z-[3] h-14 w-[7rem] min-w-[7rem] bg-[#0a0a0e] px-2 text-center align-middle text-[20px] font-medium uppercase tracking-wide text-white/45"
                    >
                      Strike
                    </th>
                    {matrix.cols.map((c) => (
                      <th
                        key={c.id}
                        scope="col"
                        className="h-14 min-w-[5.5rem] px-1 text-center align-middle text-[24px] font-semibold tabular-nums text-emerald-400"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row, ri) => (
                    <tr
                      key={row.strike}
                      data-spot={row.isSpot ? "1" : "0"}
                      className={[
                        "h-14 border-b border-white/[0.03]",
                        row.isSpot ? "border-t-2 border-amber-400/80" : "",
                      ].join(" ")}
                    >
                      <td
                        className={[
                          "sticky left-0 z-[1] h-14 w-[7rem] min-w-[7rem] border-r border-white/[0.03] px-1 text-center align-middle text-[24px] tabular-nums",
                          row.isSpot
                            ? "bg-black/40 font-bold text-amber-400"
                            : "bg-black/20 text-white/45",
                        ].join(" ")}
                      >
                        {row.label}
                      </td>
                      {matrix.cols.map((col, ci) => {
                        const cell = matrix.cells[ri]?.[ci];
                        const selected =
                          selectedTile?.strike === row.strike &&
                          selectedTile?.colId === col.id;
                        const bg = selected
                          ? darkenCssColor(cell?.bgCss || "#1a1a1a", 0.5)
                          : cell?.bgCss || "#1a1a1a";
                        return (
                          <td
                            key={col.id}
                            role="button"
                            tabIndex={0}
                            title={
                              (cell?.tooltip || "") +
                              "\nOption-click: copy ToS butterfly script"
                            }
                            aria-pressed={selected}
                            data-selected={selected ? "1" : "0"}
                            onClick={(e) => {
                              if (e.altKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!cell?.valid) return;
                                void copyTosForFly(row.strike, col.widthPts);
                                return;
                              }
                              setSelectedTile((prev) =>
                                prev?.strike === row.strike &&
                                prev?.colId === col.id
                                  ? null
                                  : { strike: row.strike, colId: col.id },
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedTile((prev) =>
                                  prev?.strike === row.strike &&
                                  prev?.colId === col.id
                                    ? null
                                    : { strike: row.strike, colId: col.id },
                                );
                              }
                            }}
                            className={[
                              "h-14 min-w-[5.5rem] cursor-pointer px-1 text-center align-middle tabular-nums text-[24px] text-amber-400",
                              "[text-shadow:0_0_2px_rgba(0,0,0,0.8)]",
                              "hover:z-[1] hover:ring-1 hover:ring-white/35",
                              selected
                                ? "z-[1] ring-2 ring-amber-400/70 brightness-90"
                                : "",
                              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-300",
                            ].join(" ")}
                            style={{ backgroundColor: bg }}
                          >
                            {cell?.display ?? "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!matrix.rows.length && (
                    <tr>
                      <td
                        colSpan={matrix.cols.length + 1}
                        className="px-4 py-24 text-center text-[24px] text-white/40"
                      >
                        {expiration
                          ? "Waiting for chain…"
                          : "Choose a contract"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[32rem] border-collapse text-sm">
                <thead
                  className="sticky top-0 z-[2] border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] text-[var(--color-label-secondary)]"
                  style={{ fontSize: "var(--text-caption, 0.75rem)" }}
                >
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-[3] bg-[var(--color-surface-secondary,var(--color-fill))] px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      Strike
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      Mid
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      Bid
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      Ask
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      Vol
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      OI
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      Δ
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold tracking-wide"
                    >
                      IV
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((row) => (
                    <StrikeRow
                      key={`${row.side}-${row.strike}`}
                      row={row}
                      flash={bus.flashStrikes.has(row.strike)}
                    />
                  ))}
                  {!ordered.length && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-24 text-center text-[var(--color-label-secondary)]"
                        style={{
                          fontSize: "var(--text-subheadline, 0.9375rem)",
                        }}
                      >
                        {expiration
                          ? "Waiting for chain quotes…"
                          : "Choose a contract to load the ladder"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
