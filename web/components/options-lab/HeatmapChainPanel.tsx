"use client";

/**
 * Heatmap app v1 — options chain ladder (templates later).
 * Layout: left control rail ~1/5 · right chain ~4/5 · full remaining viewport height.
 * Apple HIG: surface cards, segmented controls, token chrome (HIS v1.0).
 */

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import TimeMachineChrome from "@/components/options-lab/TimeMachineChrome";
import { useTmReplayActive } from "@/lib/options-lab/useTmReplayActive";
import { useChainAtPlayhead } from "@/lib/options-lab/tmChainAtT";
import { useTimeMachineHost } from "@/lib/options-lab/useTimeMachineHost";
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
import {
  DEFAULT_ROC_SENSITIVITY,
  rocSensitivityToThreshold,
} from "@/lib/options-lab/templates/color";
import {
  heatmapColumnWidths,
  heatmapProfileLine,
} from "@/lib/options-lab/templates/heatmapColumnWidths";
import { symFlyTemplate } from "@/lib/options-lab/templates/symFly";
import {
  isFlySurfaceTemplate,
  isWidthFitTemplate,
  widthFitTemplate,
} from "@/lib/options-lab/templates/widthFitTemplate";
import {
  BW_STRIKE_COUNT_CHOICES,
  BW_STRIKE_COUNT_DEFAULT,
  BW_WING_SIDE_DEFAULT,
} from "@/lib/options-lab/templates/bwFly";
import { rememberTosScript } from "@/lib/tradeLogTos";
import {
  buildGexProfile,
  fmtGexProfile,
  gexProfileScale,
} from "@/lib/options-lab/templates/gex";
import {
  FlySurfacePipeline,
  type FlyPipelinePaint,
} from "@/lib/options-lab/templates/flySurfacePipeline";
import type {
  BwWingSide,
  ChainContext,
  ColDef,
  GridCell,
  RowDef,
  TemplateParams,
  ValueModeId,
  VerticalKind,
  WidthFitWeights,
} from "@/lib/options-lab/templates/types";
import {
  verticalMetricFromMode,
  verticalValueMode,
  verticalViewLabel,
} from "@/lib/options-lab/templates/vertical";
import {
  DEFAULT_MIN_VALID_N,
  DEFAULT_STABILITY_PENALTY,
  DEFAULT_WIDTH_FIT_WEIGHTS,
  assignWidthFitColors,
  attachFooterWidths,
  widthFitSurfaceState,
  type WidthFitFooterCol,
} from "@/lib/options-lab/templates/widthFit";
import WidthFitRanking from "@/components/options-lab/WidthFitRanking";
import {
  applyAverageColorT,
  contractsFromMap,
  DEFAULT_BUDGET_MIB,
  getStreamBook,
  interestKey,
  weightsFingerprint,
  type AverageWindow,
} from "@/lib/runner/streamBook";
import {
  formatTodayHorizon,
  subscribeTmSlots,
} from "@/lib/options-lab/tmSlots";
import {
  etDayString,
  readHeatmapSession,
  writeHeatmapSession,
} from "@/lib/options-lab/heatmapSession";
import { isUsEquityRthOpenByClock } from "@/lib/market/usEquitySession";
import {
  generateTosScript,
  bwFlyTosLegs,
  symFlyTosLegs,
  verticalTosLegs,
} from "@/lib/options-lab/tosGenerator";
import {
  bwFlyDebit,
  formatHeatmapTileFace,
  listedPackageGreeks,
  resolveBwWings,
  symFlyDebit,
  verticalPackage,
} from "@/lib/options-lab/templates/pricing";
import {
  saveAnalyzerTrade,
  saveAnalyzerTradeBatch,
} from "@/lib/options-lab/analyzerTrade";
import BatmanSetupStrip from "@/components/options-lab/BatmanSetupStrip";
import {
  batmanReady,
  remapMatrixToRows,
  sharedBatmanRows,
  supportsBatman,
  type StagedFly,
} from "@/lib/options-lab/templates/batmanMode";
import HeatmapControlsColumn from "@/components/options-lab/HeatmapControlsColumn";
import MatrixViewToggle from "@/components/options-lab/MatrixViewToggle";
import {
  horizontalColumnHoverClass,
  strikesLeftToRight,
  supportsMatrixView,
  type MatrixView,
} from "@/lib/options-lab/templates/matrixView";
import {
  expectedMoveFence,
  strikeAtExpectedMove,
  type ExpectedMoveFence,
} from "@/lib/options-lab/templates/expectedMoveFence";
import { HeatmapHoverTip } from "@/components/options-lab/HeatmapHoverTip";
import HeatmapLimQuadrant from "@/components/options-lab/HeatmapLimQuadrant";
import HeatmapGexCalendar from "@/components/options-lab/HeatmapGexCalendar";
import { computeGexCal, termMassFlagOn } from "@/lib/options-lab/templates/gexCal";
import { useGexCalPack } from "@/lib/options-lab/useGexCalPack";
import { computeLim, type LimResult } from "@/lib/options-lab/templates/lim";
import {
  limChromeInfoLines,
  limNumericHeader,
  limRefusalMessage,
} from "@/lib/options-lab/templates/limChrome";
import { LimConfigError, loadLimConfig } from "@/lib/options-lab/templates/limConfig";
import {
  createLimTrail,
  type LimTrail,
  type LimTrailGhost,
} from "@/lib/options-lab/templates/limTrail";
import {
  flyColumnConvexityScores,
  heatmapGexTip,
  heatmapMatrixTip,
  miniExpirationPayoff,
  type HeatmapPositionInspect,
  type HeatmapTipModel,
} from "@/lib/options-lab/heatmapTip";

const EXPIRY_PICK_COUNT = 3;
/** Term Mass: a listed week (tape ~7 columns). Does not change the fly picker. */
const TERM_MASS_EXPIRY_COUNT = 7;

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

/** Gamma is often << 0.01 on index options — extra digits so it isn't "0". */
function fmtGreek(
  n: number | null | undefined,
  { smallDigits = 4, digits = 3 } = {},
): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  const abs = Math.abs(v);
  const d = abs !== 0 && abs < 0.01 ? smallDigits : digits;
  return v.toLocaleString(undefined, {
    maximumFractionDigits: d,
    minimumFractionDigits: 0,
  });
}

const ladderTd =
  "whitespace-nowrap border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums";
const ladderTh =
  "whitespace-nowrap px-3 py-2.5 text-right font-semibold tracking-wide";

function fmtMidSource(src: LadderRow["mid_source"]): string {
  if (src === "nbbo") return "NBBO";
  if (src === "last_trade") return "Print";
  if (src === "day_close") return "Close";
  return "—";
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

function FlyMatrixTile({
  row,
  col,
  cell,
  compact,
  selected,
  atExpectedMove,
  templateId,
  templateLabel,
  valueMode,
  modeLabel,
  convexityScore,
  widthMedian,
  tipPinned,
  onHover,
  onPin,
  onLeave,
  onOpen,
  onSelect,
  onColumnEnter,
  columnHover,
  onPreview,
}: {
  row: RowDef;
  col: ColDef;
  cell: GridCell | undefined;
  compact: boolean;
  selected: boolean;
  atExpectedMove?: boolean;
  templateId: string;
  templateLabel: string;
  valueMode: ValueModeId;
  modeLabel: string;
  convexityScore: number | null;
  widthMedian: number | null;
  tipPinned: boolean;
  onHover: (model: HeatmapTipModel, x: number, y: number) => void;
  onPin: () => void;
  onLeave: () => void;
  onOpen: () => void;
  onSelect: () => void;
  onColumnEnter?: (strike: number) => void;
  columnHover?: boolean;
  onPreview?: () => void;
}) {
  const tile =
    isWidthFitTemplate(templateId) && cell?.valid
      ? { face: "", alt: cell.tooltip || "Width Fit" }
      : formatHeatmapTileFace(cell?.display, cell?.value);
  const bg = selected
    ? darkenCssColor(cell?.bgCss || "#1a1a1a", 0.5)
    : cell?.bgCss || "#1a1a1a";
  const widthFitTip = isWidthFitTemplate(templateId)
    ? {
        colorT: cell?.colorT ?? null,
        outline: !!cell?.widthFitOutline,
        qualityFlag: cell?.qualityFlag,
        stability: cell?.widthFitStability ?? null,
        components: cell?.components,
        widthMedian,
      }
    : undefined;
  const tipArgs = {
    templateId,
    templateLabel,
    mode: valueMode,
    modeLabel,
    strike: row.strike,
    strikeLabel: row.label,
    widthPts: col.widthPts,
    widthLabel: col.label,
    tileFace: tile.face,
    tileAlt: tile.alt,
    cellValid: !!cell?.valid,
    cellValue: cell?.value ?? null,
    cellTooltip: cell?.tooltip,
    isSpot: row.isSpot,
    convexityScore,
    widthFit: widthFitTip,
  };
  return (
    <td
      role="button"
      tabIndex={0}
      aria-label={tile.alt}
      aria-pressed={selected}
      data-selected={selected ? "1" : "0"}
      data-heatmap-tile="1"
      data-spot={row.isSpot ? "1" : "0"}
      data-em={atExpectedMove ? "1" : "0"}
      data-col-hover={columnHover ? "1" : "0"}
      onClick={(e) => {
        e.stopPropagation();
        if (!cell?.valid && !isWidthFitTemplate(templateId)) return;
        onHover(
          heatmapMatrixTip({
            ...tipArgs,
            widthFit: widthFitTip
              ? { ...widthFitTip, detail: true }
              : undefined,
          }),
          e.clientX,
          e.clientY,
        );
        onPin();
        if (cell?.valid) onOpen();
      }}
      onMouseEnter={(e) => {
        onColumnEnter?.(row.strike);
        if (cell?.valid) onPreview?.();
        if (tipPinned) return;
        onHover(
          heatmapMatrixTip({
            ...tipArgs,
            widthFit: widthFitTip
              ? { ...widthFitTip, detail: false }
              : undefined,
          }),
          e.clientX,
          e.clientY,
        );
      }}
      onMouseLeave={() => {
        if (tipPinned) return;
        onLeave();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={[
        compact
          ? "h-8 min-w-0 cursor-pointer text-center align-middle tabular-nums text-[12px] leading-none text-amber-400"
          : "h-14 min-w-0 cursor-pointer overflow-hidden px-1 text-center align-middle tabular-nums text-[24px] text-amber-400",
        "[text-shadow:0_0_2px_rgba(0,0,0,0.8)]",
        compact
          ? horizontalColumnHoverClass(!!columnHover, "cell")
          : "hover:z-[1] hover:ring-1 hover:ring-white/35",
        selected
          ? "z-[1] ring-2 ring-amber-400/70 brightness-90"
          : cell?.widthFitOutline
            ? "z-[1] ring-1 ring-white/50"
            : "",
        compact && row.isSpot
          ? "shadow-[inset_2px_0_0_#fbbf24,inset_-2px_0_0_#fbbf24]"
          : compact && atExpectedMove
            ? "shadow-[inset_2px_0_0_#c084fc,inset_-2px_0_0_#c084fc]"
            : "",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-300",
      ].join(" ")}
      style={{ backgroundColor: bg }}
    >
      {tile.face}
    </td>
  );
}

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
        className={[ladderTd, "sticky left-0 z-[1]", rowBg].join(" ")}
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
      <td className={ladderTd}>{fmt(row.mid)}</td>
      <td
        className={ladderTd + " text-[var(--color-label-secondary)]"}
        title={
          row.mid_source === "nbbo"
            ? "Mid from live NBBO"
            : row.mid_source === "last_trade"
              ? "Mid from last print (no live NBBO)"
              : row.mid_source === "day_close"
                ? "Mid from prior session close"
                : undefined
        }
      >
        {fmtMidSource(row.mid_source)}
      </td>
      <td className={ladderTd + " text-[var(--color-label-secondary)]"}>
        {fmt(row.bid)}
      </td>
      <td className={ladderTd + " text-[var(--color-label-secondary)]"}>
        {fmt(row.ask)}
      </td>
      <td className={ladderTd + " text-[var(--color-label-secondary)]"}>
        {fmt(row.last)}
      </td>
      <td className={ladderTd + " text-[var(--color-label-secondary)]"}>
        {fmt(row.volume, 0)}
      </td>
      <td className={ladderTd + " text-[var(--color-label-secondary)]"}>
        {fmt(row.open_interest, 0)}
      </td>
      <td className={ladderTd} title="Delta">
        {fmtGreek(row.delta)}
      </td>
      <td className={ladderTd} title="Gamma">
        {fmtGreek(row.gamma, { smallDigits: 5, digits: 4 })}
      </td>
      <td className={ladderTd} title="Theta">
        {fmtGreek(row.theta)}
      </td>
      <td className={ladderTd} title="Vega">
        {fmtGreek(row.vega)}
      </td>
      <td className={ladderTd}>
        {row.iv != null ? `${(Number(row.iv) * 100).toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
});

export default function HeatmapChainPanel() {
  const router = useRouter();
  const { symbol, setSymbol, universe, profile, loading: universeLoading } =
    useOptionsLab();
  const flyWidths = useMemo(
    () => heatmapColumnWidths({ symbol, profile }),
    [symbol, profile?.source, profile?.fly_widths, profile?.fly_width_mode],
  );
  const [expiryContracts, setExpiryContracts] = useState<
    LadderExpirationContract[]
  >([]);
  const [termMassExps, setTermMassExps] = useState<string[]>([]);
  const [expiration, setExpiration] = useState("");
  const [side, setSide] = useState<"call" | "put">("call");
  const [batmanMode, setBatmanMode] = useState(false);
  const [stagedCall, setStagedCall] = useState<StagedFly | null>(null);
  const [stagedPut, setStagedPut] = useState<StagedFly | null>(null);
  const [wings, setWings] = useState<StrikeWings>(DEFAULT_STRIKE_WINGS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ladderDte, setLadderDte] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState(DEFAULT_HEATMAP_TEMPLATE_ID);
  const limTrailRef = useRef<LimTrail | null>(null);
  const [limGhosts, setLimGhosts] = useState<LimTrailGhost[]>([]);
  const [valueMode, setValueMode] = useState<ValueModeId>(
    () => getTemplate(DEFAULT_HEATMAP_TEMPLATE_ID).defaultValueMode,
  );
  const [verticalKind, setVerticalKind] = useState<VerticalKind>("debit");
  const [stickyScale, setStickyScale] = useState<number | undefined>(undefined);
  const [rocSensitivity, setRocSensitivity] = useState(DEFAULT_ROC_SENSITIVITY);
  const gradientThreshold = rocSensitivityToThreshold(rocSensitivity);
  /** bw-fly: N listed strikes from body for the broken wing */
  const [bwStrikeCount, setBwStrikeCount] = useState(BW_STRIKE_COUNT_DEFAULT);
  /** bw-fly: place broken wing closest to spot or furthest */
  const [bwWingSide, setBwWingSide] = useState<BwWingSide>(BW_WING_SIDE_DEFAULT);
  const [widthFitWeights, setWidthFitWeights] = useState<WidthFitWeights>(
    () => ({ ...DEFAULT_WIDTH_FIT_WEIGHTS }),
  );
  const [widthFitExpanded, setWidthFitExpanded] = useState(false);
  const [wfIface, setWfIface] = useState<"heatmap" | "ranking">("heatmap");
  const [wfTime, setWfTime] = useState<"live" | "average" | "replay">("live");
  const tmHost = useTimeMachineHost(symbol);
  const [wfWindow, setWfWindow] = useState<AverageWindow>(10);
  const [matrixView, setMatrixView] = useState<MatrixView>("vertical");
  const [cacheRev, setCacheRev] = useState(0);
  const [tmHoldLine, setTmHoldLine] = useState(
    () => formatTodayHorizon().line,
  );
  const [sessionReady, setSessionReady] = useState(false);
  const restoreSymbolRef = useRef<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<MatrixTileKey | null>(null);
  const [hoverStrike, setHoverStrike] = useState<number | null>(null);
  const [hoverTip, setHoverTip] = useState<{
    model: HeatmapTipModel;
    x: number;
    y: number;
  } | null>(null);
  const [tipPinned, setTipPinned] = useState(false);
  const tipPinnedRef = useRef(false);
  tipPinnedRef.current = tipPinned;
  const [tosScript, setTosScript] = useState<string>("");
  const [tosCopied, setTosCopied] = useState(false);
  const [tipInspect, setTipInspect] = useState<HeatmapPositionInspect | null>(
    null,
  );
  const mounted = useRef(true);

  useEffect(() => {
    const s = readHeatmapSession();
    if (s) {
      restoreSymbolRef.current = s.symbol;
      // Only restore a saved expiration if it was chosen TODAY (ET). A prior
      // day's pick (e.g. yesterday's 1DTE lingering in a still-open tab) is
      // ignored so the Heatmap starts each new day on today's 0DTE default.
      if (s.expiration && s.savedEtDay === etDayString())
        setExpiration(s.expiration);
      setSide(s.side);
      setWings(s.wings);
      setTemplateId(s.templateId);
      setValueMode(s.valueMode);
      setVerticalKind(s.verticalKind);
      setRocSensitivity(s.rocSensitivity);
      setBwStrikeCount(s.bwStrikeCount);
      setBwWingSide(s.bwWingSide);
      setWidthFitWeights(s.widthFitWeights);
      setWidthFitExpanded(s.widthFitExpanded);
      setWfIface(s.wfIface);
      setWfTime(s.wfTime);
      setWfWindow(s.wfWindow);
      setMatrixView(s.matrixView);
      setBatmanMode(s.batmanMode === true && supportsBatman(s.templateId));
      getStreamBook().setBudgetMib(DEFAULT_BUDGET_MIB);
    }
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!sessionReady || !symbol) return;
    writeHeatmapSession({
      symbol,
      expiration,
      side,
      wings,
      templateId,
      valueMode,
      verticalKind,
      rocSensitivity,
      bwStrikeCount,
      bwWingSide,
      widthFitWeights,
      widthFitExpanded,
      wfIface,
      wfTime,
      wfWindow,
      cacheBudgetMib: DEFAULT_BUDGET_MIB,
      matrixView,
      batmanMode,
    });
  }, [
    sessionReady,
    symbol,
    expiration,
    side,
    wings,
    templateId,
    valueMode,
    verticalKind,
    rocSensitivity,
    bwStrikeCount,
    bwWingSide,
    widthFitWeights,
    widthFitExpanded,
    wfIface,
    wfTime,
    wfWindow,
    matrixView,
    batmanMode,
  ]);

  // Apply per-symbol profile when product changes (wings, side, template defaults).
  // Skip once when this tab already has sticky Heatmap prefs for that symbol.
  useEffect(() => {
    if (!profile?.symbol) return;
    if (restoreSymbolRef.current === profile.symbol) {
      restoreSymbolRef.current = null;
      return;
    }
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
    // Template + value mode stay until the member switches them (Runner).
  }, [profile.symbol]); // only on symbol identity change
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const presentKeyRef = useRef<string>("");
  const centerOnPresentRef = useRef(true);
  /** AF10 — track market-plane Live transition for history seam */
  const prevSessionOpenRef = useRef<boolean | null>(null);
  /** Single pipeline instance — destroyed on plane change */
  const flyPipeRef = useRef<FlySurfacePipeline | null>(null);
  const flyPipeCallRef = useRef<FlySurfacePipeline | null>(null);
  const flyPipePutRef = useRef<FlySurfacePipeline | null>(null);
  /** Lightweight paint for active mode only (never store all 11 mode grids). */
  const [flyPaint, setFlyPaint] = useState<FlyPipelinePaint | null>(null);
  const [flyPaintCall, setFlyPaintCall] = useState<FlyPipelinePaint | null>(null);
  const [flyPaintPut, setFlyPaintPut] = useState<FlyPipelinePaint | null>(null);
  const lastIngestKeyRef = useRef("");
  /** Written ONLY after pipeline.ingest actually runs. */
  const lastIngestRef = useRef<{ hash: string; symbol: string } | null>(null);
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
  const termMassOn =
    termMassFlagOn() && tpl.layout === "matrix-profile";
  const gexCalPack = useGexCalPack({
    enabled: termMassOn,
    symbol,
    wings,
    spot: bus.spot,
    viewSide: side,
    visibleExpirations: termMassExps,
  });
  const gexCalResult = termMassOn
    ? computeGexCal({ ...gexCalPack, spot: bus.spot }, valueMode)
    : null;

  useEffect(() => {
    if (!termMassOn || !symbol) {
      setTermMassExps((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    let cancelled = false;
    void fetchLadderExpirations(symbol, TERM_MASS_EXPIRY_COUNT)
      .then((pack) => {
        if (cancelled) return;
        const next = pack.contracts
          .map((c) => (c.expiration || "").slice(0, 10))
          .filter(Boolean)
          .slice(0, TERM_MASS_EXPIRY_COUNT);
        setTermMassExps(next);
      })
      .catch(() => {
        if (!cancelled) setTermMassExps([]);
      });
    return () => {
      cancelled = true;
    };
  }, [termMassOn, symbol]);

  const verticalMetric = verticalMetricFromMode(valueMode);
  const modeLabel =
    templateId === "vertical"
      ? verticalViewLabel(verticalKind, verticalMetric)
      : (tpl.valueModes.find((m) => m.id === valueMode)?.label ?? valueMode);

  // AF10 / AF11 — dispose pipeline memory on plane change
  useEffect(() => {
    flyPipeRef.current?.seam();
    flyPipeRef.current = null;
    flyPipeCallRef.current?.seam();
    flyPipeCallRef.current = null;
    flyPipePutRef.current?.seam();
    flyPipePutRef.current = null;
    setFlyPaint(null);
    setFlyPaintCall(null);
    setFlyPaintPut(null);
    lastIngestKeyRef.current = "";
  }, [symbol, expiration, wings]);

  useEffect(() => {
    const open = bus.sessionOpen;
    const prev = prevSessionOpenRef.current;
    prevSessionOpenRef.current = open;
    if (prev === false && open === true) {
      flyPipeRef.current?.seam();
      flyPipeCallRef.current?.seam();
      flyPipePutRef.current?.seam();
      lastIngestKeyRef.current = "";
    }
  }, [bus.sessionOpen]);

  useEffect(() => {
    const allowed = tpl.valueModes.some((m) => m.id === valueMode);
    if (!allowed) setValueMode(tpl.defaultValueMode);
  }, [templateId, tpl, valueMode]);

  useEffect(() => {
    if (templateId !== "vertical") return;
    if (valueMode === "debit" || valueMode === "credit") {
      setVerticalKind(valueMode);
    }
  }, [templateId, valueMode]);

  useEffect(() => {
    setStickyScale(undefined);
    setSelectedTile(null);
  }, [templateId]);

  useEffect(() => {
    setSelectedTile(null);
    setHoverTip(null);
    setTipPinned(false);
    setTipInspect(null);
    setStagedCall(null);
    setStagedPut(null);
  }, [symbol, expiration, side, wings, valueMode, bwStrikeCount, bwWingSide, templateId]);

  useEffect(() => {
    if (!supportsBatman(templateId) && batmanMode) setBatmanMode(false);
  }, [templateId, batmanMode]);

  useEffect(() => {
    if (!batmanMode) {
      setStagedCall(null);
      setStagedPut(null);
    }
  }, [batmanMode]);

  // Leave fly surface templates → free pipeline
  useEffect(() => {
    if (isFlySurfaceTemplate(templateId)) return;
    flyPipeRef.current?.seam();
    flyPipeRef.current = null;
    flyPipeCallRef.current?.seam();
    flyPipeCallRef.current = null;
    flyPipePutRef.current?.seam();
    flyPipePutRef.current = null;
    setFlyPaint(null);
    setFlyPaintCall(null);
    setFlyPaintPut(null);
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
    const sticky = readHeatmapSession();
    const keepExp =
      sticky?.symbol === symbol &&
      Boolean(sticky.expiration) &&
      sticky.savedEtDay === etDayString();
    if (!keepExp) {
      setExpiration("");
      setLadderDte(null);
    }
    setExpiryContracts([]);
    let cancelled = false;
    const loadExpiries = async () => {
      try {
        const pack = await fetchLadderExpirations(symbol, EXPIRY_PICK_COUNT);
        if (cancelled || !mounted.current) return;
        setExpiryContracts(pack.contracts);
        // Prefer sticky listed expiration, else server default (skips 0DTE
        // after RTH close). Client clock is a safety net if an older API
        // still returns expired 0DTE first.
        let def =
          pack.default_expiration || pack.contracts[0]?.expiration || "";
        const listed = (e: string) =>
          pack.contracts.some((c) => c.expiration === e);
        if (keepExp && sticky?.expiration && listed(sticky.expiration)) {
          def = sticky.expiration;
        } else {
          const sessionOpen = isUsEquityRthOpenByClock();
          if (!sessionOpen && pack.contracts.length) {
            const first = pack.contracts.find((c) => c.expiration === def);
            if (first && first.dte === 0) {
              const next = pack.contracts.find((c) => c.dte > 0);
              if (next) def = next.expiration;
            }
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

  const liveChainCtx: ChainContext = useMemo(
    () => ({
      symbol,
      viewSide: side,
      spot: bus.spot,
      strikeStep: bus.strikeStep,
      wings,
      contracts: bus.contracts,
      asOf: bus.asOf,
      contentHash: bus.hash,
      columnWidths: flyWidths,
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
      flyWidths,
    ],
  );
  const atPlayhead = useChainAtPlayhead({
    symbol,
    viewSide: side,
    wings,
    live: liveChainCtx,
  });
  const replayActive = useTmReplayActive();
  const chainCtx: ChainContext = isWidthFitTemplate(templateId)
    ? wfTime === "replay"
      ? atPlayhead
      : liveChainCtx
    : replayActive
      ? atPlayhead
      : liveChainCtx;

  /** All local: OPF-held generation already in `chainCtx`. No extra fetch. */
  const openHeldTile = useCallback(
    (
      body: number,
      widthPts: number,
      paintSide: "call" | "put" = side,
      opts?: { preview?: boolean },
    ) => {
      if (!expiration) return null;
      const ctx: ChainContext = { ...chainCtx, viewSide: paintSide };
      const shortFly =
        templateId === "vertical"
          ? verticalKind === "credit"
          : valueMode === "credit";
      let cost: number | null = null;
      let legs;
      let structure = `${body} × ${widthPts}`;
      if (templateId === "vertical") {
        const dir = shortFly ? "short" : "long";
        const d = verticalPackage(ctx, body, widthPts, dir);
        cost = d != null && Number.isFinite(d) ? Math.abs(d) : null;
        legs = verticalTosLegs({
          body,
          widthPts,
          expiration,
          side: paintSide,
          short: shortFly,
        });
      } else if (templateId === "bw-fly") {
        const wings = resolveBwWings(
          ctx,
          body,
          widthPts,
          bwStrikeCount,
          bwWingSide,
        );
        if (!wings) return null;
        const d = bwFlyDebit(ctx, body, wings.lo, wings.hi);
        cost = d != null && Number.isFinite(d) ? Math.abs(d) : null;
        structure = `${wings.lo}/${body}/${wings.hi} ×${widthPts}`;
        legs = bwFlyTosLegs({
          lo: wings.lo,
          body,
          hi: wings.hi,
          expiration,
          side: paintSide,
          short: shortFly,
        });
      } else {
        const d = symFlyDebit(ctx, body, widthPts);
        cost = d != null && Number.isFinite(d) ? Math.abs(d) : null;
        structure = `${body - widthPts}/${body}/${body + widthPts} ×${widthPts}`;
        legs = symFlyTosLegs({
          body,
          widthPts,
          expiration,
          side: paintSide,
          short: shortFly,
        });
      }
      const script = generateTosScript({
        symbol,
        legs,
        costBasis: cost,
      });
      const signedDebit = shortFly ? -(cost ?? 0) : cost ?? 0;
      const payoff = miniExpirationPayoff({
        legs,
        debit: signedDebit,
        spot: ctx.spot,
      });
      const inspect: HeatmapPositionInspect = {
        greeks: listedPackageGreeks(ctx, paintSide, legs),
        payoff: payoff.points,
        maxProfit: payoff.maxProfit,
        maxLoss: payoff.maxLoss,
        spot: ctx.spot,
      };
      setTipInspect(inspect);
      if (opts?.preview) {
        return { script, inspect };
      }
      if (batmanMode && supportsBatman(templateId)) {
        const staged: StagedFly = {
          side: paintSide,
          body,
          widthPts,
          script,
          debit: cost,
          structure,
          inspect,
        };
        if (paintSide === "call") setStagedCall(staged);
        else setStagedPut(staged);
        setSelectedTile({ strike: body, colId: `w${widthPts}` });
        setTosScript(script);
        return { script, inspect };
      }
      setTosScript(script);
      setSelectedTile({ strike: body, colId: `w${widthPts}` });
      rememberTosScript(script);
      void navigator.clipboard.writeText(script).then(
        () => {
          setTosCopied(true);
          window.setTimeout(() => setTosCopied(false), 1600);
        },
        () => setTosCopied(false),
      );
      return { script, inspect };
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
      batmanMode,
    ],
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!tipPinnedRef.current) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('[data-testid="heatmap-tile-tip"]')) return;
      if (t?.closest?.("[data-heatmap-tile='1']")) return;
      setTipPinned(false);
      setHoverTip(null);
      setTipInspect(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setTipPinned(false);
      setHoverTip(null);
      setTipInspect(null);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

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
    if (!isFlySurfaceTemplate(templateId)) return;
    if (!bus.hash || !chainCtx.contracts.size) return;

    const last = lastIngestRef.current;
    if (
      last &&
      symbol !== last.symbol &&
      bus.hash === last.hash
    ) {
      // panel symbol moved; generation hash has not — leftover contracts
      return; // skip ingest; do not paint new widths onto the old book
    }

    const ingestMode = isWidthFitTemplate(templateId)
      ? "width_fit"
      : valueMode;
    const ingestKey = `${bus.hash}|${symbol}|${batmanMode ? "batman" : side}|${ingestMode}|${flyWidths.join(",")}`;
    if (ingestKey === lastIngestKeyRef.current) return;

    if (ingestRafRef.current) cancelAnimationFrame(ingestRafRef.current);
    const hashAtSchedule = bus.hash;
    const modeAtSchedule = ingestMode;
    ingestRafRef.current = requestAnimationFrame(() => {
      ingestRafRef.current = 0;
      // Drop stale frame if hash moved again
      if (bus.hash !== hashAtSchedule) return;
      const colorParams = {
        valueMode: modeAtSchedule,
        widthMode: "fixed_points" as const,
        fixedPoints: flyWidths,
        stickyScale,
        gradientThreshold,
        widthFitWeights,
        minValidN: DEFAULT_MIN_VALID_N,
        stabilityPenaltyStrength: DEFAULT_STABILITY_PENALTY,
        widthFitNormalization: "per_width" as const,
      };
      const paintSide = (
        viewSide: "call" | "put",
        pipeRef: typeof flyPipeRef,
        setPaint: typeof setFlyPaint,
      ) => {
        if (!pipeRef.current) pipeRef.current = new FlySurfacePipeline();
        const paint = pipeRef.current.ingest(
          { ...chainCtx, viewSide },
          modeAtSchedule,
          flyWidths,
          { receivedAt: genReceivedAtRef.current.at || Date.now() },
        );
        if (modeAtSchedule === "width_fit") {
          widthFitTemplate.assignColors(paint.cells, colorParams);
        } else {
          symFlyTemplate.assignColors(paint.cells, colorParams);
        }
        setPaint(paint);
      };
      if (batmanMode && supportsBatman(templateId)) {
        paintSide("call", flyPipeCallRef, setFlyPaintCall);
        paintSide("put", flyPipePutRef, setFlyPaintPut);
      } else {
        paintSide(side, flyPipeRef, setFlyPaint);
      }
      lastIngestKeyRef.current = `${hashAtSchedule}|${symbol}|${batmanMode ? "batman" : side}|${modeAtSchedule}|${flyWidths.join(",")}`;
      lastIngestRef.current = { hash: hashAtSchedule, symbol };
    });

    return () => {
      if (ingestRafRef.current) cancelAnimationFrame(ingestRafRef.current);
    };
    // Intentionally NOT depending on full chainCtx identity — hash is the gen gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chainCtx read inside when hash changes
  }, [templateId, bus.hash, symbol, side, batmanMode, valueMode, flyWidths, stickyScale, gradientThreshold, widthFitWeights]);

  const templateParams: TemplateParams = useMemo(
    () => ({
      valueMode,
      verticalKind,
      widthMode: "fixed_points",
      fixedPoints: flyWidths,
      stickyScale,
      gradientThreshold,
      bwStrikeCount,
      bwWingSide,
      widthFitWeights,
      minValidN: DEFAULT_MIN_VALID_N,
      stabilityPenaltyStrength: DEFAULT_STABILITY_PENALTY,
      widthFitNormalization: "per_width",
    }),
    [
      valueMode,
      verticalKind,
      stickyScale,
      bwStrikeCount,
      bwWingSide,
      flyWidths,
      gradientThreshold,
      widthFitWeights,
    ],
  );

  const flyPaintReady =
    lastIngestRef.current?.symbol === symbol ? flyPaint : null;

  const paintToMatrix = useCallback(
    (paint: FlyPipelinePaint) => {
      const wantMode = isWidthFitTemplate(tpl.id) ? "width_fit" : valueMode;
      if (paint.mode !== wantMode) return null;
      const cells = paint.cells.map((row) => row.map((c) => ({ ...c })));
      if (isWidthFitTemplate(tpl.id)) {
        const wf = assignWidthFitColors(cells, templateParams);
        return {
          rows: paint.rows,
          cols: paint.cols,
          cells,
          stickyScale: wf.stickyScale,
          footer: attachFooterWidths(wf.footer, paint.cols),
        };
      }
      const colored = symFlyTemplate.assignColors(cells, templateParams);
      return {
        rows: paint.rows,
        cols: paint.cols,
        cells,
        stickyScale: colored.stickyScale,
        footer: [] as WidthFitFooterCol[],
      };
    },
    [tpl.id, valueMode, templateParams],
  );

  const matrix = useMemo(() => {
    if (tpl.layout !== "matrix") return null;
    if (isFlySurfaceTemplate(tpl.id)) {
      if (!flyPaintReady) return null;
      return paintToMatrix(flyPaintReady);
    }
    const built = buildGrid(tpl, chainCtx, templateParams);
    return { ...built, footer: [] as WidthFitFooterCol[] };
  }, [tpl, chainCtx, templateParams, flyPaintReady, paintToMatrix]);

  const batmanBoards = useMemo(() => {
    if (!batmanMode || !supportsBatman(templateId) || tpl.layout !== "matrix") {
      return null;
    }
    if (isFlySurfaceTemplate(templateId)) {
      const call = flyPaintCall ? paintToMatrix(flyPaintCall) : null;
      const put = flyPaintPut ? paintToMatrix(flyPaintPut) : null;
      if (!call || !put) return null;
      const rows = sharedBatmanRows(call.rows, put.rows, chainCtx.spot);
      return {
        call: remapMatrixToRows(call, rows),
        put: remapMatrixToRows(put, rows),
      };
    }
    const callRaw = {
      ...buildGrid(tpl, { ...chainCtx, viewSide: "call" }, templateParams),
      footer: [] as WidthFitFooterCol[],
    };
    const putRaw = {
      ...buildGrid(tpl, { ...chainCtx, viewSide: "put" }, templateParams),
      footer: [] as WidthFitFooterCol[],
    };
    const rows = sharedBatmanRows(callRaw.rows, putRaw.rows, chainCtx.spot);
    return {
      call: remapMatrixToRows(callRaw, rows),
      put: remapMatrixToRows(putRaw, rows),
    };
  }, [
    batmanMode,
    templateId,
    tpl,
    chainCtx,
    templateParams,
    flyPaintCall,
    flyPaintPut,
    paintToMatrix,
    chainCtx.spot,
  ]);

  const bookKey = interestKey(symbol, expiration);
  const weightsFp = weightsFingerprint(widthFitWeights);

  const lastBookHash = useRef<string>("");
  useEffect(() => {
    // TR14: record raw OPF generations for this tab, any Heatmap template.
    // Width Fit memo is optional; GEX / flies / verticals still fill the book.
    if (!bus.hash || !chainCtx.contracts.size) return;
    getStreamBook().setBudgetMib(DEFAULT_BUDGET_MIB);
    const wfMemo =
      isWidthFitTemplate(templateId) && matrix
        ? {
            weightsFp,
            colorT: matrix.cells.map((row) => row.map((c) => c.colorT)),
            widthPts: matrix.cols.map((c) => c.widthPts),
            median: (matrix.footer ?? []).map((f) => f.median),
            stability: (matrix.footer ?? []).map((f) => f.stability),
            n: (matrix.footer ?? []).map((f) => f.n),
          }
        : null;
    getStreamBook().push(bookKey, {
      contentHash: bus.hash,
      asOf: chainCtx.asOf,
      receivedAt: Date.now(),
      epochQuality: "ok",
      stale: bus.transport === "held",
      contracts: contractsFromMap(chainCtx.contracts),
      spot: chainCtx.spot,
      strikeStep: chainCtx.strikeStep,
      wings: chainCtx.wings,
      memo: wfMemo,
    });
    if (lastBookHash.current !== bus.hash) {
      lastBookHash.current = bus.hash;
      setCacheRev((n) => n + 1);
    }
    // hash is the gen gate; matrix/memo refresh same hash in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bus.hash, bookKey, weightsFp, templateId, flyPaint, chainCtx.contracts.size]);

  const displayMatrix = useMemo(() => {
    if (!matrix) return null;
    if (!isWidthFitTemplate(templateId) || wfTime !== "average") return matrix;
    const avg = getStreamBook().averageColorT(bookKey, wfWindow, weightsFp);
    if (!avg.used) return matrix;
    const cells = applyAverageColorT(matrix.cells, avg.grid);
    return { ...matrix, cells };
  }, [matrix, templateId, wfTime, bookKey, wfWindow, weightsFp, cacheRev]);

  const boards = useMemo(() => {
    if (batmanBoards) {
      return [
        { side: "call" as const, matrix: batmanBoards.call },
        { side: "put" as const, matrix: batmanBoards.put },
      ];
    }
    if (displayMatrix) return [{ side, matrix: displayMatrix }];
    return [];
  }, [batmanBoards, displayMatrix, side]);

  const emFence: ExpectedMoveFence | null = useMemo(() => {
    if (!supportsMatrixView(templateId) || !displayMatrix?.rows.length) {
      return null;
    }
    return expectedMoveFence(
      chainCtx,
      displayMatrix.rows.map((r) => r.strike),
    );
  }, [templateId, displayMatrix, chainCtx.contentHash, chainCtx.spot]);

  const rankingStats = useMemo(() => {
    if (!matrix || !isWidthFitTemplate(templateId)) return null;
    if (wfTime === "average") {
      const s = getStreamBook().averageWidthStats(
        bookKey,
        wfWindow,
        weightsFp,
      );
      if (s.used) return s;
    }
    return {
      widthPts: matrix.cols.map((c) => c.widthPts),
      meanMedian: (matrix.footer ?? []).map((f) => f.median),
      minStability: (matrix.footer ?? []).map((f) => f.stability),
      nGens: (matrix.footer ?? []).map((f) => f.n),
      used: 1,
    };
  }, [matrix, templateId, wfTime, bookKey, wfWindow, weightsFp, cacheRev]);

  useEffect(() => {
    setTmHoldLine(formatTodayHorizon().line);
    return subscribeTmSlots(() => {
      setTmHoldLine(formatTodayHorizon().line);
    });
  }, []);

  /** Same-width listed-gamma rank, 1–10. Held chain only. */
  const convexityScores = useMemo(() => {
    const out = new Map<string, number>();
    if (!matrix) return out;
    const bodies = matrix.rows.map((r) => r.strike);
    for (const col of matrix.cols) {
      const w = col.widthPts;
      const colMap = flyColumnConvexityScores(
        chainCtx,
        side,
        bodies,
        (body) => {
          if (templateId === "vertical") {
            const far = side === "call" ? body + w : body - w;
            return [
              { strike: body, quantity: 1 },
              { strike: far, quantity: -1 },
            ];
          }
          if (templateId === "bw-fly") {
            const wings = resolveBwWings(
              chainCtx,
              body,
              w,
              bwStrikeCount,
              bwWingSide,
            );
            if (!wings) return null;
            return [
              { strike: wings.lo, quantity: 1 },
              { strike: body, quantity: -2 },
              { strike: wings.hi, quantity: 1 },
            ];
          }
          return [
            { strike: body - w, quantity: 1 },
            { strike: body, quantity: -2 },
            { strike: body + w, quantity: 1 },
          ];
        },
      );
      for (const [body, score] of colMap) {
        out.set(`${body}|${col.id}`, score);
      }
    }
    return out;
  }, [matrix, chainCtx, side, templateId, bwStrikeCount, bwWingSide]);
  const gexProfile = useMemo(() => {
    if (tpl.layout !== "profile" || tpl.id !== "gex") return null;
    const points = buildGexProfile(chainCtx, valueMode);
    const scale = gexProfileScale(points, valueMode);
    return { points, scale };
  }, [tpl.layout, tpl.id, chainCtx, valueMode]);

  const limGexPoints = useMemo(() => {
    if (tpl.layout !== "quadrant") return null;
    return buildGexProfile(chainCtx, "gex_net");
  }, [tpl.layout, chainCtx]);

  const limPack = useMemo(() => {
    if (tpl.layout !== "quadrant" || !limGexPoints) {
      return {
        result: null as LimResult | null,
        error: null as string | null,
        showAnnotations: false,
      };
    }
    try {
      const nets = limGexPoints.map((p) => ({
        strike: p.strike,
        call: p.call,
        put: p.put,
        net: p.value,
      }));
      const result = computeLim(chainCtx, {
        expiration,
        oiAsOf: null,
        nets,
      });
      const showAnnotations = loadLimConfig().LIM_SHOW_ANNOTATIONS;
      return { result, error: null, showAnnotations };
    } catch (e) {
      const msg =
        e instanceof LimConfigError
          ? e.message
          : e instanceof Error
            ? e.message
            : "LIM failed";
      return { result: null, error: msg, showAnnotations: false };
    }
  }, [tpl.layout, chainCtx, expiration, limGexPoints]);

  useEffect(() => {
    if (tpl.layout !== "quadrant" || !limPack.result) {
      setLimGhosts([]);
      return;
    }
    if (!limTrailRef.current) {
      try {
        const cfg = loadLimConfig();
        limTrailRef.current = createLimTrail({
          intervalS: cfg.LIM_TRAIL_INTERVAL_S,
          windowMin: cfg.LIM_TRAIL_WINDOW_MIN,
          now: () => Date.now(),
        });
      } catch {
        return;
      }
    }
    setLimGhosts(
      limTrailRef.current.observe(
        { xUnclamped: limPack.result.xUnclamped, y: limPack.result.y },
        {
          symbol: chainCtx.symbol,
          expiration: expiration || "",
          asOf: chainCtx.asOf,
        },
      ),
    );
  }, [tpl.layout, limPack.result, chainCtx.symbol, chainCtx.asOf, expiration]);

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

  const batmanScrollLock = useRef(false);
  const syncBatmanScroll = useCallback((src: HTMLElement) => {
    if (!batmanMode || batmanScrollLock.current) return;
    const callG = document.querySelector(
      '[data-testid="batman-call-graph"]',
    ) as HTMLElement | null;
    const putG = document.querySelector(
      '[data-testid="batman-put-graph"]',
    ) as HTMLElement | null;
    const other = src === callG ? putG : src === putG ? callG : null;
    if (!other) return;
    batmanScrollLock.current = true;
    other.scrollLeft = src.scrollLeft;
    other.scrollTop = src.scrollTop;
    batmanScrollLock.current = false;
  }, [batmanMode]);

  const centerSpot = useCallback(() => {
    const roots = batmanMode
      ? ([
          document.querySelector('[data-testid="batman-call-graph"]'),
          document.querySelector('[data-testid="batman-put-graph"]'),
        ].filter(Boolean) as HTMLElement[])
      : scrollRef.current
        ? [scrollRef.current]
        : [];
    if (!roots.length) return false;
    let ok = false;
    for (const root of roots) {
      const spotEl = root.querySelector(
        '[data-spot="1"]',
      ) as HTMLElement | null;
      if (!spotEl) continue;
      const rootRect = root.getBoundingClientRect();
      const elRect = spotEl.getBoundingClientRect();
      root.scrollTop +=
        elRect.top + elRect.height / 2 - (rootRect.top + rootRect.height / 2);
      root.scrollLeft +=
        elRect.left + elRect.width / 2 - (rootRect.left + rootRect.width / 2);
      ok = true;
    }
    return ok;
  }, [batmanMode]);

  useEffect(() => {
    if (!centerOnPresentRef.current || !ordered.length) return;
    if (!ordered.some((r) => r.is_spot)) return;
    const id = window.requestAnimationFrame(() => {
      if (centerSpot()) centerOnPresentRef.current = false;
    });
    return () => window.cancelAnimationFrame(id);
  }, [ordered, centerSpot]);

  useEffect(() => {
    if (!batmanMode || !batmanBoards) return;
    const id = window.requestAnimationFrame(() => {
      centerSpot();
    });
    return () => window.cancelAnimationFrame(id);
  }, [batmanMode, batmanBoards, matrixView, centerSpot]);

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
        templateId={templateId}
        tpl={tpl}
        onTemplateChange={setTemplateId}
        valueMode={valueMode}
        onValueModeChange={setValueMode}
        verticalKind={verticalKind}
        onVerticalKindChange={(kind) => {
          setVerticalKind(kind);
          setValueMode(verticalValueMode(kind, verticalMetric));
        }}
        verticalMetric={verticalMetric}
        onVerticalMetricChange={(metric) => {
          setValueMode(verticalValueMode(verticalKind, metric));
        }}
        bwStrikeCount={bwStrikeCount}
        onBwStrikeCountChange={setBwStrikeCount}
        bwWingSide={bwWingSide}
        onBwWingSideChange={setBwWingSide}
        profileLine={heatmapProfileLine({
          strikeStep: profile.strike_step,
          flyWidths,
          source: profile.source,
          kind: profile.kind,
        })}
        expiration={expiration}
        expiryContracts={expiryContracts}
        onExpirationChange={(v) => {
          setExpiration(v);
          const c = expiryContracts.find((x) => x.expiration === v);
          setLadderDte(c != null ? c.dte : null);
        }}
        side={side}
        onSideChange={setSide}
        rocSensitivity={rocSensitivity}
        onRocSensitivityChange={setRocSensitivity}
        onCenterSpot={() => {
          centerSpot();
        }}
        hasSpotRow={hasSpotRow}
        matrixView={matrixView}
        onMatrixViewChange={setMatrixView}
        batmanMode={batmanMode}
        onBatmanModeChange={setBatmanMode}
        tosScript={tosScript}
        tosCopied={tosCopied}
        onCopyTos={() => {
          rememberTosScript(tosScript);
          void navigator.clipboard.writeText(tosScript).then(() => {
            setTosCopied(true);
            window.setTimeout(() => setTosCopied(false), 1600);
          });
        }}
        widthFit={
          isWidthFitTemplate(templateId) && matrix
            ? {
                weights: widthFitWeights,
                onWeights: setWidthFitWeights,
                expanded: widthFitExpanded,
                onExpanded: setWidthFitExpanded,
                state: widthFitSurfaceState(matrix.footer ?? []),
                footer: matrix.footer ?? [],
                iface: wfIface,
                onIface: setWfIface,
                time: wfTime,
                onTime: (v) => {
                  setWfTime(v);
                  if (v === "replay" && !replayActive) tmHost.onPlay();
                },
                replayEnabled: replayActive,
                window: wfWindow,
                onWindow: setWfWindow,
                avgUsed:
                  wfTime === "average"
                    ? getStreamBook().averageColorT(
                        bookKey,
                        wfWindow,
                        weightsFp,
                      ).used
                    : null,
              }
            : null
        }
        tmHold={{ line: tmHoldLine }}
        onOpenAnalyzer={() => {
          if (batmanMode) return;
          saveAnalyzerTrade(tosScript, "heatmap");
        }}
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
        aria-label="Runner view"
      >
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2,0_4px_16px_rgba(0,0,0,0.18))]"
          data-testid="heatmap-view-panel"
        >
          <div className="relative z-[2] flex shrink-0 items-center gap-2 border-b border-[var(--color-separator)] px-2 py-1.5">
            <label className="sr-only" htmlFor="runner-symbol">
              Symbol
            </label>
            <select
              id="runner-symbol"
              className="min-h-11 min-w-[7.5rem] shrink-0 rounded-[var(--radius-md,0.5rem)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-2.5 text-sm font-semibold text-[var(--color-label)] shadow-[var(--elevation-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] disabled:opacity-45"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={universeLoading || !universe.length}
              data-testid="options-lab-symbol"
            >
              {universe.map((u) => (
                <option key={u.symbol} value={u.symbol}>
                  {u.symbol}
                </option>
              ))}
              {!universe.length && !universeLoading && (
                <option value={symbol}>{symbol}</option>
              )}
            </select>
            <div className="min-w-0 flex-1">
              <TimeMachineChrome
                symbol={symbol}
                watermarkTestId="heatmap-replay-watermark"
              />
            </div>
          </div>
          {/* Panel header */}
          <header className="relative z-[1] flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h3
                  className="truncate font-semibold tracking-tight text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline, 1.0625rem)" }}
                >
                  {tpl.label}
                </h3>
                {tpl.layout === "quadrant" ? (
                  <details
                    className="relative"
                    data-testid="lim-chrome-info"
                  >
                    <summary
                      className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-[13px] font-semibold text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)] [&::-webkit-details-marker]:hidden"
                      aria-label="LIM reading notes"
                    >
                      i
                    </summary>
                    <div className="absolute left-0 top-8 z-20 w-[min(22rem,70vw)] space-y-1.5 rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] p-3 text-[11px] leading-snug text-[var(--color-label-secondary)] shadow-lg">
                      {limChromeInfoLines(limPack.result?.oiAsOf ?? null).map((line) => (
                        <p key={line} data-testid="lim-chrome-info-line">
                          {line}
                        </p>
                      ))}
                    </div>
                  </details>
                ) : null}
                {tpl.valueModes.length > 1 ? (
                  <span className="text-xs font-medium text-[var(--color-label-secondary)]">
                    · {modeLabel}
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
              {tpl.layout === "quadrant" ? (
                limPack.result?.valid ? (
                  <p
                    className="mt-0.5 truncate text-[11px] tabular-nums text-[var(--color-label)]"
                    data-testid="lim-numeric-header"
                  >
                    {limNumericHeader(limPack.result)}
                  </p>
                ) : limPack.result ? (
                  <p
                    className="mt-0.5 truncate text-[11px] text-[var(--color-label)]"
                    data-testid="lim-header-refusal"
                  >
                    {limRefusalMessage(limPack.result)}
                  </p>
                ) : null
              ) : null}
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
              {emFence ? (
                <span
                  className="tabular-nums text-violet-300"
                  data-testid="heatmap-expected-move"
                  title="ATM call + put mid on this expiration"
                >
                  EM ±{emFence.em.toFixed(1)}
                </span>
              ) : null}
              {bus.hash ? (
                <span
                  className="hidden tabular-nums text-[var(--color-label-tertiary)] sm:inline"
                  title={bus.hash}
                >
                  gen {bus.hash.slice(0, 8)}
                </span>
              ) : null}
              {supportsMatrixView(templateId) && tpl.layout === "matrix" ? (
                <MatrixViewToggle
                  compact
                  value={matrixView}
                  onChange={setMatrixView}
                  testId="heatmap-matrix-view-panel"
                />
              ) : null}
              {supportsBatman(templateId) ? (
                <button
                  type="button"
                  aria-pressed={batmanMode}
                  data-testid="heatmap-batman-mode-panel"
                  onClick={() => setBatmanMode((v) => !v)}
                  className={
                    secondaryBtn +
                    " min-h-9 px-3 py-1 text-xs " +
                    (batmanMode ? "bg-[var(--color-fill)]" : "")
                  }
                >
                  Batman
                </button>
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
              "min-h-0 flex-1",
              batmanMode
                ? "flex flex-col overflow-hidden"
                : tpl.layout === "quadrant" || tpl.layout === "matrix-profile"
                  ? "overflow-hidden"
                  : "overflow-x-auto overflow-y-auto",
              tpl.layout === "matrix" ||
              tpl.layout === "profile" ||
              tpl.layout === "quadrant" ||
              tpl.layout === "matrix-profile"
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

                  const gexModel = heatmapGexTip({
                    strikeLabel: pt.label,
                    isSpot: pt.isSpot,
                    combined,
                    call: pt.call,
                    put: pt.put,
                    net: pt.value,
                    callLabel:
                      pt.call != null ? fmtGexProfile(pt.call) : "—",
                    putLabel: pt.put != null ? fmtGexProfile(pt.put) : "—",
                    netLabel:
                      pt.value != null ? fmtGexProfile(pt.value) : "—",
                  });

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
                      onMouseEnter={(e) => {
                        if (tipPinnedRef.current) return;
                        setHoverTip({
                          model: gexModel,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseLeave={() => {
                        if (tipPinnedRef.current) return;
                        setHoverTip(null);
                      }}
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
            ) : tpl.layout === "quadrant" ? (
              <HeatmapLimQuadrant
                result={limPack.result}
                errorMessage={limPack.error}
                ghosts={limGhosts}
                gexPoints={limGexPoints}
                chainCtx={chainCtx}
                spot={chainCtx.spot}
                showAnnotations={limPack.showAnnotations}
              />
            ) : tpl.layout === "matrix-profile" && gexCalResult ? (
              <HeatmapGexCalendar result={gexCalResult} />
            ) : isWidthFitTemplate(templateId) &&
              wfIface === "ranking" &&
              rankingStats ? (
              <WidthFitRanking
                symbol={symbol}
                expirationLabel={
                  expiryContracts.find((c) => c.expiration === expiration)
                    ?.label || expiration || "—"
                }
                asOfLabel={
                  chainCtx.asOf
                    ? new Date(chainCtx.asOf).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—"
                }
                snapshotLine={
                  wfTime === "average"
                    ? `Average · ${getStreamBook().averageWidthStats(bookKey, wfWindow, weightsFp).used} of ${wfWindow}`
                    : "Live heat-map snapshot"
                }
                widthPts={rankingStats.widthPts}
                median={rankingStats.meanMedian}
                n={rankingStats.nGens}
                stability={rankingStats.minStability}
              />
            ) : tpl.layout === "matrix" && boards.length ? (
              <div
                className={
                  batmanMode
                    ? "flex h-full min-h-0 flex-col bg-black"
                    : undefined
                }
                data-testid={batmanMode ? "heatmap-batman" : undefined}
              >
              {boards.map((board, boardIndex) => {
                const displayMatrix = board.matrix;
                const emFence = expectedMoveFence(
                  chainCtx,
                  displayMatrix.rows.map((r) => r.strike),
                );
                const paintSide = board.side;
                const hRows = strikesLeftToRight(displayMatrix.rows);
                const hRowIndex = new Map(
                  displayMatrix.rows.map((r, i) => [r.strike, i]),
                );
                const staged =
                  batmanMode && supportsBatman(templateId)
                    ? paintSide === "call"
                      ? stagedCall
                      : stagedPut
                    : null;
                return (
              <Fragment key={board.side}>
              {batmanMode && boardIndex === 1 ? (
                <BatmanSetupStrip
                  call={stagedCall}
                  put={stagedPut}
                  onClear={(s) => {
                    if (s === "call") setStagedCall(null);
                    else setStagedPut(null);
                  }}
                  onSend={() => {
                    if (!batmanReady(stagedCall, stagedPut) || !stagedCall || !stagedPut) {
                      return;
                    }
                    saveAnalyzerTradeBatch(
                      [stagedCall.script, stagedPut.script],
                      "heatmap",
                    );
                    router.push("/app/options-lab/analyzer");
                  }}
                />
              ) : null}
              <div
                className={
                  batmanMode
                    ? "min-h-0 flex-1 overflow-auto bg-[#0a0a0e]"
                    : undefined
                }
                data-testid={batmanMode ? `batman-${paintSide}-graph` : undefined}
                onScroll={
                  batmanMode
                    ? (e) => syncBatmanScroll(e.currentTarget)
                    : undefined
                }
              >
              {supportsMatrixView(templateId) && matrixView === "horizontal" ? (
              <table
                className="w-full table-fixed border-collapse text-[12px] leading-none"
                data-testid="heatmap-matrix"
                data-matrix-view="horizontal"
                onMouseLeave={() => setHoverStrike(null)}
              >
                <thead className="sticky top-0 z-[2] bg-[#0a0a0e]/90 backdrop-blur-sm">
                  <tr className="h-8 border-b border-white/10">
                    <th
                      scope="col"
                      className="sticky left-0 z-[3] h-8 w-12 min-w-12 bg-[#0a0a0e] px-0.5 text-center align-middle text-[9px] font-medium uppercase leading-tight tracking-wide text-white/45"
                    >
                      Width
                      <span className="block normal-case tracking-normal text-white/35">
                        \ body
                      </span>
                    </th>
                    {hRows.map((row) => (
                      <th
                        key={row.strike}
                        scope="col"
                        data-spot={row.isSpot ? "1" : "0"}
                        data-em={
                          strikeAtExpectedMove(emFence, row.strike) ? "1" : "0"
                        }
                        data-col-hover={
                          hoverStrike === row.strike ? "1" : "0"
                        }
                        title={
                          strikeAtExpectedMove(emFence, row.strike)
                            ? `Expected move (ATM straddle ±${emFence!.em.toFixed(1)})`
                            : undefined
                        }
                        onMouseEnter={() => setHoverStrike(row.strike)}
                        className={[
                          "h-8 min-w-0 text-center align-middle text-[11px] font-semibold tabular-nums",
                          row.isSpot
                            ? "text-amber-400 shadow-[inset_2px_0_0_#fbbf24,inset_-2px_0_0_#fbbf24]"
                            : strikeAtExpectedMove(emFence, row.strike)
                              ? "text-violet-300 shadow-[inset_2px_0_0_#c084fc,inset_-2px_0_0_#c084fc]"
                              : "text-emerald-400",
                          horizontalColumnHoverClass(
                            hoverStrike === row.strike,
                            "head",
                          ),
                        ].join(" ")}
                      >
                        {row.label}
                      </th>
                    ))}
                    <th
                      scope="col"
                      aria-hidden
                      className="sticky right-0 z-[3] h-8 w-12 min-w-12 bg-[#0a0a0e] px-0.5 text-center align-middle text-[9px] font-medium uppercase leading-tight tracking-wide text-white/45"
                      data-testid="heatmap-width-col-right-head"
                    >
                      Width
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayMatrix.cols.map((col, ci) => (
                    <tr
                      key={col.id}
                      className="h-8 border-b border-white/[0.03]"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-[1] h-8 w-12 min-w-12 border-r border-white/[0.03] bg-black/20 px-0.5 text-center align-middle text-[12px] font-semibold tabular-nums text-emerald-400"
                      >
                        {col.label}
                      </th>
                      {hRows.map((row) => {
                        const ri = hRowIndex.get(row.strike) ?? 0;
                        const cell = displayMatrix.cells[ri]?.[ci];
                        return (
                          <FlyMatrixTile
                            key={row.strike}
                            row={row}
                            col={col}
                            cell={cell}
                            compact
                            columnHover={hoverStrike === row.strike}
                            onColumnEnter={setHoverStrike}
                            atExpectedMove={strikeAtExpectedMove(
                              emFence,
                              row.strike,
                            )}
                            selected={
                              staged
                                ? staged.body === row.strike &&
                                  staged.widthPts === col.widthPts
                                : selectedTile?.strike === row.strike &&
                                  selectedTile?.colId === col.id
                            }
                            templateId={templateId}
                            templateLabel={tpl.label}
                            valueMode={valueMode}
                            modeLabel={modeLabel}
                            convexityScore={
                              convexityScores.get(`${row.strike}|${col.id}`) ??
                              null
                            }
                            widthMedian={
                              displayMatrix.footer?.[ci]?.median ?? null
                            }
                            tipPinned={tipPinned}
                            onHover={(model, x, y) =>
                              setHoverTip({ model, x, y })
                            }
                            onPin={() => setTipPinned(true)}
                            onLeave={() => {
                              setHoverTip(null);
                              setTipInspect(null);
                            }}
                            onPreview={() =>
                              openHeldTile(
                                row.strike,
                                col.widthPts,
                                paintSide,
                                { preview: true },
                              )
                            }
                            onOpen={() =>
                              openHeldTile(
                                row.strike,
                                col.widthPts,
                                paintSide,
                              )
                            }
                            onSelect={() =>
                              setSelectedTile((prev) =>
                                prev?.strike === row.strike &&
                                prev?.colId === col.id
                                  ? null
                                  : { strike: row.strike, colId: col.id },
                              )
                            }
                          />
                        );
                      })}
                      <th
                        scope="row"
                        className="sticky right-0 z-[1] h-8 w-12 min-w-12 border-l border-white/[0.03] bg-black/20 px-0.5 text-center align-middle text-[12px] font-semibold tabular-nums text-emerald-400"
                        data-testid={`heatmap-width-col-right-${col.id}`}
                      >
                        {col.label}
                      </th>
                    </tr>
                  ))}
                  {!displayMatrix.rows.length && (
                    <tr>
                      <td
                        colSpan={displayMatrix.rows.length + 2}
                        className="px-4 py-16 text-center text-[16px] text-white/40"
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
              /* Symmetric flies matrix: 2× type vs MSC 12/10px baseline */
              <table className="w-full min-w-[40rem] table-fixed border-collapse text-[24px] leading-none" data-testid="heatmap-matrix" data-matrix-view="vertical">
                <thead className="sticky top-0 z-[2] bg-[#0a0a0e]/90 backdrop-blur-sm">
                  <tr className="h-14 border-b border-white/10">
                    <th
                      scope="col"
                      className="sticky left-0 z-[3] h-14 w-[7rem] min-w-[7rem] bg-[#0a0a0e] px-2 text-center align-middle text-[20px] font-medium uppercase tracking-wide text-white/45"
                    >
                      Strike
                    </th>
                    {displayMatrix.cols.map((c) => (
                      <th
                        key={c.id}
                        scope="col"
                        className="h-14 min-w-0 px-1 text-center align-middle text-[24px] font-semibold tabular-nums text-emerald-400"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayMatrix.rows.map((row, ri) => {
                    const anyOutline = displayMatrix.cells.some((r) =>
                      r.some((c) => c.widthFitOutline),
                    );
                    const hideRow =
                      isWidthFitTemplate(templateId) &&
                      !widthFitExpanded &&
                      anyOutline &&
                      !row.isSpot &&
                      !displayMatrix.cells[ri]?.some((c) => c.widthFitOutline);
                    if (hideRow) return null;
                    return (
                    <tr
                      key={row.strike}
                      data-spot={row.isSpot ? "1" : "0"}
                      data-em={
                        strikeAtExpectedMove(emFence, row.strike) ? "1" : "0"
                      }
                      className={[
                        "h-14 border-b border-white/[0.03]",
                        row.isSpot
                          ? "border-t-2 border-amber-400/80"
                          : strikeAtExpectedMove(emFence, row.strike)
                            ? "border-t-2 border-b-2 border-violet-400/80"
                            : "",
                      ].join(" ")}
                    >
                      <td
                        className={[
                          "sticky left-0 z-[1] h-14 w-[7rem] min-w-[7rem] border-r border-white/[0.03] px-1 text-center align-middle text-[24px] tabular-nums",
                          row.isSpot
                            ? "bg-black/40 font-bold text-amber-400"
                            : strikeAtExpectedMove(emFence, row.strike)
                              ? "bg-violet-950/50 font-bold text-violet-300"
                              : "bg-black/20 text-white/45",
                        ].join(" ")}
                        title={
                          strikeAtExpectedMove(emFence, row.strike)
                            ? `Expected move (ATM straddle ±${emFence!.em.toFixed(1)})`
                            : undefined
                        }
                      >
                        {row.label}
                      </td>
                      {displayMatrix.cols.map((col, ci) => {
                        const cell = displayMatrix.cells[ri]?.[ci];
                        return (
                          <FlyMatrixTile
                            key={col.id}
                            row={row}
                            col={col}
                            cell={cell}
                            compact={false}
                            atExpectedMove={strikeAtExpectedMove(
                              emFence,
                              row.strike,
                            )}
                            selected={
                              staged
                                ? staged.body === row.strike &&
                                  staged.widthPts === col.widthPts
                                : selectedTile?.strike === row.strike &&
                                  selectedTile?.colId === col.id
                            }
                            templateId={templateId}
                            templateLabel={tpl.label}
                            valueMode={valueMode}
                            modeLabel={modeLabel}
                            convexityScore={
                              convexityScores.get(
                                `${row.strike}|${col.id}`,
                              ) ?? null
                            }
                            widthMedian={
                              displayMatrix.footer?.[ci]?.median ?? null
                            }
                            tipPinned={tipPinned}
                            onHover={(model, x, y) =>
                              setHoverTip({ model, x, y })
                            }
                            onPin={() => setTipPinned(true)}
                            onLeave={() => {
                              setHoverTip(null);
                              setTipInspect(null);
                            }}
                            onPreview={() =>
                              openHeldTile(
                                row.strike,
                                col.widthPts,
                                paintSide,
                                { preview: true },
                              )
                            }
                            onOpen={() =>
                              openHeldTile(
                                row.strike,
                                col.widthPts,
                                paintSide,
                              )
                            }
                            onSelect={() =>
                              setSelectedTile((prev) =>
                                prev?.strike === row.strike &&
                                prev?.colId === col.id
                                  ? null
                                  : { strike: row.strike, colId: col.id },
                              )
                            }
                          />
                        );
                      })}
                    </tr>
                    );
                  })}
                  {!displayMatrix.rows.length && (
                    <tr>
                      <td
                        colSpan={displayMatrix.cols.length + 1}
                        className="px-4 py-24 text-center text-[24px] text-white/40"
                      >
                        {expiration
                          ? "Waiting for chain…"
                          : "Choose a contract"}
                      </td>
                    </tr>
                  )}
                </tbody>
                {isWidthFitTemplate(templateId) && displayMatrix.footer?.length ? (
                  <tfoot data-testid="width-fit-footer">
                    <tr className="h-14 border-t border-white/15 bg-[#0a0a0e]">
                      <th
                        scope="row"
                        className="sticky left-0 z-[1] w-[7rem] bg-[#0a0a0e] px-1 text-center text-[11px] font-medium uppercase tracking-wide text-white/45"
                      >
                        Width Fit
                      </th>
                      {displayMatrix.footer.map((f) => (
                        <td
                          key={f.widthPts}
                          className="px-1 text-center align-middle text-[11px] tabular-nums text-white/70"
                          data-testid={`width-fit-footer-${f.widthPts}`}
                          data-low-n={f.lowConfidence ? "1" : "0"}
                        >
                          {f.lowConfidence
                            ? `n ${f.n}`
                            : f.median != null
                              ? `${f.median.toFixed(2)} · n ${f.n}`
                              : `n ${f.n}`}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
              )}
              </div>
              </Fragment>
                );
              })}
              </div>
            ) : (
              <table
                className="w-max min-w-full border-collapse text-sm"
                data-testid="heatmap-strike-ladder"
              >
                <thead
                  className="sticky top-0 z-[2] border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] text-[var(--color-label-secondary)]"
                  style={{ fontSize: "var(--text-caption, 0.75rem)" }}
                >
                  <tr>
                    <th
                      scope="col"
                      className={
                        ladderTh +
                        " sticky left-0 z-[3] bg-[var(--color-surface-secondary,var(--color-fill))]"
                      }
                    >
                      Strike
                    </th>
                    <th scope="col" className={ladderTh}>
                      Mid
                    </th>
                    <th
                      scope="col"
                      className={ladderTh}
                      title="How mid was formed"
                    >
                      Src
                    </th>
                    <th scope="col" className={ladderTh}>
                      Bid
                    </th>
                    <th scope="col" className={ladderTh}>
                      Ask
                    </th>
                    <th
                      scope="col"
                      className={ladderTh}
                      title="Last trade"
                    >
                      Last
                    </th>
                    <th scope="col" className={ladderTh}>
                      Vol
                    </th>
                    <th scope="col" className={ladderTh}>
                      OI
                    </th>
                    <th scope="col" className={ladderTh} title="Delta">
                      Δ
                    </th>
                    <th scope="col" className={ladderTh} title="Gamma">
                      Γ
                    </th>
                    <th scope="col" className={ladderTh} title="Theta">
                      Θ
                    </th>
                    <th scope="col" className={ladderTh} title="Vega">
                      Vega
                    </th>
                    <th scope="col" className={ladderTh}>
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
                        colSpan={13}
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
      <HeatmapHoverTip
        model={hoverTip?.model ?? null}
        x={hoverTip?.x ?? 0}
        y={hoverTip?.y ?? 0}
        pinned={tipPinned}
        tosScript={tipPinned ? tosScript : null}
        copied={tosCopied}
        inspect={tipInspect}
        selectOnly={batmanMode}
        onSelect={() => {
          /* Tile click already staged this fly. Button must not navigate. */
        }}
        onAnalyze={() => {
          if (batmanMode) return;
          if (tosScript) saveAnalyzerTrade(tosScript, "heatmap");
        }}
        onClose={() => {
          setTipPinned(false);
          setHoverTip(null);
          setTipInspect(null);
        }}
      />
    </div>
  );
}
