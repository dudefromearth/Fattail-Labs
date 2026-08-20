"use client";

/**
 * Analyzer 2D host-contract viewport.
 * If this pane is painted, left-drag pans and wheel zooms.
 * Bind is the host node's life — not a skippable useEffect.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  atmCenteredXRange,
  fitPnlYRange,
  AUTOFIT_PAD_FRAC,
  EXP_BREAKEVEN_MAX_VIEWPORT_FRAC,
} from "@/lib/risk-graph/pricing/autofitView";
import { clampAxisRange } from "@/lib/risk-graph/pnlChartViewPolicy";
import { dollarAxisStep } from "@/lib/risk-graph/axisGrid";
import {
  bindChartHost,
  CHART_HOST_PAD,
  type HostView,
} from "@/lib/risk-graph/chartHostBind";
import {
  bindStrikeHandles,
  hitStrikeHandle,
  strikeHandleHot,
  type StrikeHandle,
  type StrikeDragInfo,
  type StrikeDragPreview,
} from "@/lib/risk-graph/strikeHandleBind";
import type { PnLPoint, PnLChartHandle } from "@/lib/risk-graph/pnlChartTypes";
import type { ThresholdAlertType } from "@/lib/options-lab/analyzerBook";
import {
  hostCrosshairReadout,
  inPlot,
  nearestPositionOnExpiration,
  toHostDataX,
  type HostAlertMenu,
  type PositionAlertChoice,
  type PositionExpirationCurve,
} from "@/lib/risk-graph/hostAlertMenu";
import {
  fmtGexAxis,
  GEX_DISPLAY_DIV,
  gexSidePeaks,
  gexValueToPlotY,
  type GexProfilePoint,
} from "@/lib/options-lab/templates/gex";
import type { ValueModeId } from "@/lib/options-lab/templates/types";

const PAD = CHART_HOST_PAD;
const AXIS_FONT = "19.5px ui-monospace, monospace";
const GEX_CAPTION_FONT = "16.5px ui-monospace, monospace";
const GEX_CALL_RGB = "14,165,233";
const GEX_PUT_RGB = "239,68,68";

function niceStep(range: number, target: number): number {
  const rough = range / Math.max(target, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 1e-9))));
  const n = rough / mag;
  let nice = 10;
  if (n <= 1) nice = 1;
  else if (n <= 2) nice = 2;
  else if (n <= 5) nice = 5;
  return nice * mag;
}

/** Underlier prices where real-time P&L crosses 0. */
function realtimeZeroCrossings(pts: PnLPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (!Number.isFinite(a.price) || !Number.isFinite(b.price)) continue;
    if (!Number.isFinite(a.pnl) || !Number.isFinite(b.pnl)) continue;
    if (a.pnl === 0) {
      out.push(a.price);
      continue;
    }
    if (a.pnl * b.pnl < 0) {
      const t = a.pnl / (a.pnl - b.pnl);
      out.push(a.price + t * (b.price - a.price));
    }
  }
  const last = pts[pts.length - 1];
  if (
    last &&
    Number.isFinite(last.price) &&
    Number.isFinite(last.pnl) &&
    last.pnl === 0
  ) {
    out.push(last.price);
  }
  return out;
}

export type HostPnLChartProps = {
  expirationData: PnLPoint[];
  theoreticalData: PnLPoint[];
  expiredExpirationData?: PnLPoint[];
  spotPrice: number;
  spotIndicatorPrice?: number;
  expirationBreakevens: number[];
  theoreticalBreakevens: number[];
  strikes: number[];
  theoreticalStroke?: string;
  theoreticalLegendLabel?: string;
  gexEnabled?: boolean;
  gexValueMode?: ValueModeId;
  gexPoints?: GexProfilePoint[];
  gexScale?: number;
  gexOpacityPct?: number;
  rangeEnabled?: boolean;
  rangeBands?: { lo: number; hi: number }[];
  strikeHandles?: StrikeHandle[];
  onStrikeDrag?: (info: StrikeDragInfo | null) => void;
  onStrikeCommit?: (info: StrikeDragInfo) => void;
  snapStrike?: (
    positionId: string,
    grabbedStrike: number,
    rawTarget: number,
  ) => number;
  alertLines?: { price: number; color: string; active?: boolean }[];
  /** Per Shown card at-expiration series — MSC 8px hit, that card only. */
  positionExpirationCurves?: PositionExpirationCurve[];
  positionAlertChoices?: PositionAlertChoice[];
  onCanvasAlert?: (price: number, type: ThresholdAlertType) => void;
  onPositionAlert?: (
    positionId: string,
    price: number,
    type: ThresholdAlertType,
  ) => void;
};

const HostPnLChart = forwardRef<PnLChartHandle, HostPnLChartProps>(
  function HostPnLChart(
    {
      expirationData,
      theoreticalData,
      expiredExpirationData = [],
      spotPrice,
      spotIndicatorPrice,
      expirationBreakevens,
      theoreticalBreakevens,
      strikes,
      theoreticalStroke = "#e879f9",
      theoreticalLegendLabel = "T+0",
      gexEnabled = false,
      gexValueMode = "gex_all",
      gexPoints = [],
      gexScale = 1,
      gexOpacityPct = 40,
      rangeEnabled = false,
      rangeBands = [],
      strikeHandles = [],
      onStrikeDrag,
      onStrikeCommit,
      snapStrike,
      alertLines = [],
      positionExpirationCurves = [],
      positionAlertChoices = [],
      onCanvasAlert,
      onPositionAlert,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const unbindRef = useRef<(() => void) | null>(null);
    const viewRef = useRef<HostView>({
      xMin: 0,
      xMax: 100,
      yMin: -100,
      yMax: 100,
    });
    const userAdjustedRef = useRef(false);
    const drawRef = useRef<() => void>(() => {});
    const rafRef = useRef(0);
    const handlesRef = useRef<StrikeHandle[]>([]);
    handlesRef.current = strikeHandles;
    const previewRef = useRef<StrikeDragPreview>(null);
    const hoverRef = useRef<StrikeHandle | null>(null);
    const groupRef = useRef<string | null>(null);
    const hoverShiftRef = useRef(false);
    const commitRef = useRef(onStrikeCommit);
    commitRef.current = onStrikeCommit;
    const dragRef = useRef(onStrikeDrag);
    dragRef.current = onStrikeDrag;
    const snapRef = useRef(snapStrike);
    snapRef.current = snapStrike;
    const posCurvesRef = useRef(positionExpirationCurves);
    posCurvesRef.current = positionExpirationCurves;
    const hoveredPosRef = useRef<string | null>(null);
    const trackRef = useRef<{ x: number; y: number } | null>(null);
    const canvasAlertRef = useRef(onCanvasAlert);
    canvasAlertRef.current = onCanvasAlert;
    const positionAlertRef = useRef(onPositionAlert);
    positionAlertRef.current = onPositionAlert;
    const [alertMenu, setAlertMenu] = useState<
      | (HostAlertMenu & {
          step: "root" | "condition";
          positionId?: string;
        })
      | null
    >(null);

    const fit = useCallback((): HostView => {
      const expBes = expirationBreakevens.filter(Number.isFinite);
      const contentPrices = [
        ...strikes.filter(Number.isFinite),
        ...expBes,
        ...theoreticalBreakevens.filter(Number.isFinite),
      ];
      const { xMin, xMax } = atmCenteredXRange({
        spot: spotPrice,
        contentPrices,
        padFrac: AUTOFIT_PAD_FRAC,
        expBreakevenPrices: expBes,
        expBreakevenMaxViewportFrac: EXP_BREAKEVEN_MAX_VIEWPORT_FRAC,
      });
      const pnls = [
        ...expirationData,
        ...theoreticalData,
        ...expiredExpirationData,
      ]
        .filter((p) => p.price >= xMin && p.price <= xMax)
        .map((p) => p.pnl)
        .filter(Number.isFinite);
      if (pnls.length === 0) {
        pnls.push(
          ...expirationData.map((p) => p.pnl),
          ...theoreticalData.map((p) => p.pnl),
          0,
        );
      }
      const { yMin, yMax } = fitPnlYRange(pnls.length ? pnls : [0], "default");
      return { xMin, xMax, yMin, yMax };
    }, [
      expirationData,
      theoreticalData,
      expiredExpirationData,
      expirationBreakevens,
      theoreticalBreakevens,
      strikes,
      spotPrice,
    ]);

    const autoFit = useCallback(() => {
      userAdjustedRef.current = false;
      viewRef.current = fit();
      drawRef.current();
    }, [fit]);

    useImperativeHandle(ref, () => ({ autoFit }), [autoFit]);

    const draw = useCallback(() => {
      try {
      const canvas = canvasRef.current;
      const host = hostRef.current;
      if (!canvas || !host) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width < 50 || height < 50) {
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            drawRef.current();
          });
        }
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      let { xMin, xMax, yMin, yMax } = viewRef.current;
      const xSpan = xMax - xMin;
      const ySpan = yMax - yMin;
      if (!(xSpan > 0) || !Number.isFinite(xSpan)) {
        const x = clampAxisRange(xMin, xMax);
        xMin = x.min;
        xMax = x.max;
        viewRef.current.xMin = xMin;
        viewRef.current.xMax = xMax;
      }
      if (!(ySpan > 0) || !Number.isFinite(ySpan)) {
        const y = clampAxisRange(yMin, yMax);
        yMin = y.min;
        yMax = y.max;
        viewRef.current.yMin = yMin;
        viewRef.current.yMax = yMax;
      }

      host.dataset.painted = "1";
      host.dataset.viewX = `${xMin}:${xMax}`;

      const cw = width - PAD.left - PAD.right;
      const ch = height - PAD.top - PAD.bottom;
      const toX = (price: number) =>
        PAD.left + ((price - xMin) / (xMax - xMin)) * cw;
      const toY = (pnl: number) =>
        PAD.top + ((yMax - pnl) / (yMax - yMin)) * ch;

      ctx.fillStyle = "#0a0a0e";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#16161c";
      ctx.fillRect(PAD.left, PAD.top, cw, ch);

      if (rangeEnabled && rangeBands.length) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD.left, PAD.top, cw, ch);
        ctx.clip();
        const fills = ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.10)"];
        rangeBands.forEach((b, i) => {
          if (!(b.hi > b.lo) || !Number.isFinite(b.lo) || !Number.isFinite(b.hi)) {
            return;
          }
          const x0 = toX(b.lo);
          const x1 = toX(b.hi);
          ctx.fillStyle = fills[Math.min(i, fills.length - 1)];
          ctx.fillRect(x0, PAD.top, Math.max(0, x1 - x0), ch);
        });
        ctx.restore();
      }

      if (alertLines.length) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD.left, PAD.top, cw, ch);
        ctx.clip();
        for (const line of alertLines) {
          if (!Number.isFinite(line.price)) continue;
          if (line.price < xMin || line.price > xMax) continue;
          const cx = toX(line.price);
          ctx.strokeStyle = line.color || "#f59e0b";
          ctx.lineWidth = line.active ? 2 : 1;
          ctx.setLineDash(line.active ? [] : [5, 4]);
          ctx.beginPath();
          ctx.moveTo(cx, PAD.top);
          ctx.lineTo(cx, PAD.top + ch);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.font = AXIS_FONT;
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const yStep = dollarAxisStep(yMax - yMin);
      const y0 = Math.ceil(yMin / yStep) * yStep;
      for (let y = y0; y <= yMax; y += yStep) {
        const cy = toY(y);
        ctx.beginPath();
        ctx.moveTo(PAD.left, cy);
        ctx.lineTo(width - PAD.right, cy);
        ctx.stroke();
        const lab = y >= 0 ? `+${y.toFixed(0)}` : `-${Math.abs(y).toFixed(0)}`;
        ctx.fillText(lab, PAD.left - 6, cy);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const xStep = dollarAxisStep(xMax - xMin);
      const x0 = Math.ceil(xMin / xStep) * xStep;
      for (let x = x0; x <= xMax; x += xStep) {
        const cx = toX(x);
        ctx.beginPath();
        ctx.moveTo(cx, PAD.top);
        ctx.lineTo(cx, height - PAD.bottom);
        ctx.stroke();
        ctx.fillText(x.toFixed(0), cx, height - PAD.bottom + 8);
      }

      const scale = Math.max(gexScale, 1e-12);
      const gexA = Math.max(0, Math.min(1, gexOpacityPct / 100));
      const combined =
        gexValueMode === "gex_all" ||
        gexValueMode === "gex_call" ||
        gexValueMode === "gex_put";
      if (gexEnabled && gexPoints.length && gexA > 0) {
        const inView = gexPoints
          .map((p) => p.strike)
          .filter((k) => k >= xMin && k <= xMax)
          .sort((a, b) => a - b);
        const gaps: number[] = [];
        for (let i = 1; i < inView.length; i++) {
          gaps.push(inView[i] - inView[i - 1]);
        }
        gaps.sort((a, b) => a - b);
        const gapPx =
          gaps.length > 0
            ? ((gaps[Math.floor(gaps.length / 2)] / (xMax - xMin)) * cw)
            : 10;
        const barW = Math.max(2, Math.min(14, gapPx * 0.42));
        const gexAxisY = PAD.top + ch / 2;
        const sides = gexSidePeaks(gexPoints);
        const callPeak = Math.max(sides.call, 1e-12);
        const putPeak = Math.max(sides.put, 1e-12);
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD.left, PAD.top, cw, ch);
        ctx.clip();
        for (const pt of gexPoints) {
          if (pt.strike < xMin || pt.strike > xMax) continue;
          const cx = toX(pt.strike);
          if (combined) {
            if (pt.call != null && sides.hasCall) {
              const top = gexValueToPlotY(
                Math.abs(pt.call),
                callPeak,
                PAD.top,
                ch,
              );
              const hCall = gexAxisY - top;
              if (hCall > 0.5) {
                ctx.fillStyle = `rgba(${GEX_CALL_RGB},${gexA})`;
                ctx.fillRect(cx - barW / 2, top, barW, hCall);
              }
            }
            if (pt.put != null && sides.hasPut) {
              const bot = gexValueToPlotY(
                -Math.abs(pt.put),
                putPeak,
                PAD.top,
                ch,
              );
              const hPut = bot - gexAxisY;
              if (hPut > 0.5) {
                ctx.fillStyle = `rgba(${GEX_PUT_RGB},${gexA})`;
                ctx.fillRect(cx - barW / 2, gexAxisY, barW, hPut);
              }
            }
          } else if (pt.valid && pt.value != null) {
            const magY = gexValueToPlotY(
              gexValueMode === "gex_abs" ? Math.abs(pt.value) : pt.value,
              scale,
              PAD.top,
              ch,
            );
            const neg = gexValueMode !== "gex_abs" && pt.value < 0;
            const h = Math.abs(magY - gexAxisY);
            if (h > 0.5) {
              ctx.fillStyle = neg
                ? `rgba(${GEX_PUT_RGB},${gexA})`
                : `rgba(${GEX_CALL_RGB},${gexA})`;
              if (neg) ctx.fillRect(cx - barW / 2, gexAxisY, barW, h);
              else ctx.fillRect(cx - barW / 2, magY, barW, h);
            }
          }
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.22 * gexA})`;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(PAD.left, gexAxisY);
        ctx.lineTo(width - PAD.right, gexAxisY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        const xSpine = width - PAD.right;
        const xLab = xSpine + 6;
        const paintGexTicks = (
          peak: number,
          direction: 1 | -1,
          rgb: string,
          includeZero: boolean,
        ) => {
          const dispPeak = Math.abs(peak) / GEX_DISPLAY_DIV;
          if (!(dispPeak > 0)) return;
          const step = niceStep(Math.max(dispPeak, 1e-9), 4);
          if (!(step > 0) || !Number.isFinite(step)) return;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.font = AXIS_FONT;
          const paint = (rawMag: number, isZero: boolean) => {
            const signed = direction * rawMag;
            const y = gexValueToPlotY(signed, peak, PAD.top, ch);
            if (y < PAD.top - 1 || y > PAD.top + ch + 1) return;
            ctx.strokeStyle = isZero
              ? "rgba(255,255,255,0.35)"
              : `rgba(${rgb},0.55)`;
            ctx.beginPath();
            ctx.moveTo(xSpine - 4, y);
            ctx.lineTo(xSpine, y);
            ctx.stroke();
            ctx.fillStyle = isZero
              ? "rgba(255,255,255,0.55)"
              : `rgba(${rgb},0.92)`;
            ctx.fillText(fmtGexAxis(signed), xLab, y);
          };
          if (includeZero) paint(0, true);
          for (let u = step; u <= dispPeak + step * 0.001; u += step) {
            const raw = u * GEX_DISPLAY_DIV;
            if (raw > Math.abs(peak) * 1.001) break;
            paint(raw, false);
          }
        };

        const caption = (
          label: string,
          rgb: string,
          y: number,
          baseline: CanvasTextBaseline,
        ) => {
          ctx.font = GEX_CAPTION_FONT;
          ctx.textAlign = "right";
          ctx.textBaseline = baseline;
          ctx.fillStyle = rgb.startsWith("rgba") ? rgb : `rgba(${rgb},0.9)`;
          ctx.fillText(label, width - 8, y);
        };

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(xSpine, PAD.top);
        ctx.lineTo(xSpine, PAD.top + ch);
        ctx.stroke();
        if (combined) {
          if (sides.hasCall) {
            caption("Call", GEX_CALL_RGB, PAD.top - 6, "bottom");
            paintGexTicks(callPeak, 1, GEX_CALL_RGB, !sides.hasPut);
          }
          if (sides.hasPut) {
            caption("Put", GEX_PUT_RGB, PAD.top + ch + 6, "top");
            paintGexTicks(putPeak, -1, GEX_PUT_RGB, true);
          }
        } else if (gexValueMode === "gex_abs") {
          caption("GEX", GEX_CALL_RGB, PAD.top - 6, "bottom");
          paintGexTicks(scale, 1, GEX_CALL_RGB, true);
        } else {
          caption("Net", "rgba(255,255,255,0.45)", PAD.top - 6, "bottom");
          paintGexTicks(scale, 1, GEX_CALL_RGB, false);
          paintGexTicks(scale, -1, GEX_PUT_RGB, true);
        }
        ctx.restore();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(PAD.left, toY(0));
      ctx.lineTo(width - PAD.right, toY(0));
      ctx.stroke();

      const spotX = toX(spotIndicatorPrice ?? spotPrice);
      if (Number.isFinite(spotX)) {
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(spotX, PAD.top);
        ctx.lineTo(spotX, height - PAD.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const strokeSeries = (pts: PnLPoint[], color: string, widthPx: number) => {
        if (pts.length < 2) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = widthPx;
        ctx.beginPath();
        let started = false;
        for (const p of pts) {
          if (!Number.isFinite(p.price) || !Number.isFinite(p.pnl)) continue;
          const cx = toX(p.price);
          const cy = toY(p.pnl);
          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      };
      ctx.globalAlpha = 0.45;
      strokeSeries(expiredExpirationData, "#22d3ee", 1.5);
      ctx.globalAlpha = 1;
      strokeSeries(expirationData, "#22d3ee", 2);
      strokeSeries(theoreticalData, theoreticalStroke, 2);

      const hoveredId = hoveredPosRef.current;
      const hoveredCurve = hoveredId
        ? posCurvesRef.current.find((c) => c.id === hoveredId)
        : null;
      if (hoveredCurve && hoveredCurve.expiration.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD.left, PAD.top, cw, ch);
        ctx.clip();
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.2;
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        let glowStarted = false;
        for (const p of hoveredCurve.expiration) {
          if (!Number.isFinite(p.price) || !Number.isFinite(p.pnl)) continue;
          const cx = toX(p.price);
          const cy = toY(p.pnl);
          if (!glowStarted) {
            ctx.moveTo(cx, cy);
            glowStarted = true;
          } else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();
        strokeSeries([...hoveredCurve.expiration], "#22d3ee", 4);
      }

      const zeroY = toY(0);
      if (Number.isFinite(zeroY)) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD.left, PAD.top, cw, ch);
        ctx.clip();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.lineCap = "butt";
        const tick = 16;
        for (const px of realtimeZeroCrossings(theoreticalData)) {
          if (!Number.isFinite(px) || px < xMin || px > xMax) continue;
          const cx = toX(px);
          ctx.beginPath();
          ctx.moveTo(cx, zeroY - tick);
          ctx.lineTo(cx, zeroY + tick);
          ctx.stroke();
        }
        const prev = previewRef.current;
        const hover = hoverRef.current;
        for (const hdl of handlesRef.current) {
          const k = hdl.strike;
          if (!Number.isFinite(k) || k < xMin || k > xMax) continue;
          const cx = toX(k);
          const hot = strikeHandleHot(hdl, {
            preview: prev,
            hover,
            hoverShift: hoverShiftRef.current,
          });
          ctx.strokeStyle = hot ? "#fbbf24" : "#f59e0b";
          ctx.lineWidth = hot ? 3 : 1;
          const ht = hot ? 28 : 16;
          ctx.beginPath();
          ctx.moveTo(cx, zeroY - ht);
          ctx.lineTo(cx, zeroY + ht);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.font = "13px ui-monospace, monospace";
      ctx.fillStyle = "#22d3ee";
      ctx.textAlign = "left";
      ctx.fillText("At expiry", PAD.left + 8, PAD.top + 12);
      ctx.fillStyle = theoreticalStroke;
      ctx.fillText(theoreticalLegendLabel, PAD.left + 8, PAD.top + 28);

      const track = trackRef.current;
      const readout =
        track &&
        hostCrosshairReadout(track.x, track.y, width, height, {
          xMin,
          xMax,
          yMin,
          yMax,
        });
      if (readout && track) {
        host.dataset.crosshairPrice = readout.priceLabel;
        host.dataset.crosshairPnl = readout.pnlLabel;
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD.left, PAD.top, cw, ch);
        ctx.clip();
        ctx.strokeStyle = "rgba(150,150,150,0.6)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(track.x, PAD.top);
        ctx.lineTo(track.x, PAD.top + ch);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PAD.left, track.y);
        ctx.lineTo(PAD.left + cw, track.y);
        ctx.stroke();
        ctx.restore();

        const paintChip = (
          text: string,
          cx: number,
          cy: number,
          bg: string,
          fg: string,
          axis: "x" | "y",
        ) => {
          ctx.font = AXIS_FONT;
          const padX = 6;
          const chipH = 22;
          const chipW = ctx.measureText(text).width + padX * 2;
          let x =
            axis === "x" ? cx - chipW / 2 : Math.max(4, PAD.left - chipW - 6);
          let y = axis === "x" ? height - PAD.bottom + 6 : cy - chipH / 2;
          x = Math.max(2, Math.min(x, width - chipW - 2));
          y = Math.max(2, Math.min(y, height - chipH - 2));
          ctx.fillStyle = bg;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, chipW, chipH, 3);
          } else {
            ctx.rect(x, y, chipW, chipH);
          }
          ctx.fill();
          ctx.fillStyle = fg;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, x + chipW / 2, y + chipH / 2);
        };
        paintChip(
          readout.priceLabel,
          track.x,
          0,
          "#3b82f6",
          "#fff",
          "x",
        );
        paintChip(
          readout.pnlLabel,
          0,
          track.y,
          "rgba(100,100,100,0.9)",
          "#fff",
          "y",
        );
      } else {
        delete host.dataset.crosshairPrice;
        delete host.dataset.crosshairPnl;
      }
      } catch {
        /* keep pan/zoom alive */
      }
    }, [
      expirationData,
      theoreticalData,
      expiredExpirationData,
      spotPrice,
      spotIndicatorPrice,
      gexEnabled,
      gexValueMode,
      gexPoints,
      gexScale,
      gexOpacityPct,
      rangeEnabled,
      rangeBands,
      theoreticalStroke,
      theoreticalLegendLabel,
      strikeHandles,
      alertLines,
    ]);

    drawRef.current = draw;
    const fitRef = useRef(fit);
    fitRef.current = fit;

    const attach = useCallback((node: HTMLDivElement | null) => {
      const live =
        !!node &&
        hostRef.current === node &&
        !!unbindRef.current &&
        node.dataset.wheelBound === "1";
      if (live) return;
      unbindRef.current?.();
      unbindRef.current = null;
      hostRef.current = node;
      if (!node) return;
      if (!userAdjustedRef.current) viewRef.current = fitRef.current();
      const unbindStrikes = bindStrikeHandles({
        host: node,
        view: viewRef,
        handles: handlesRef,
        preview: previewRef,
        hover: hoverRef,
        group: groupRef,
        hoverShift: hoverShiftRef,
        draw: () => drawRef.current(),
        onPreview: (info) => {
          if (info) userAdjustedRef.current = true;
          dragRef.current?.(info);
        },
        onCommit: (info) => commitRef.current?.(info),
        snapTarget: (positionId, grabbed, raw) =>
          snapRef.current?.(positionId, grabbed, raw) ?? grabbed,
      });
      unbindRef.current = bindChartHost({
        host: node,
        view: viewRef,
        userAdjusted: userAdjustedRef,
        draw: () => drawRef.current(),
        hitHandle: (e) =>
          hitStrikeHandle(e, node, viewRef.current, handlesRef.current) !=
          null,
      });
      const hitPosition = (mx: number, my: number, w: number, h: number) =>
        nearestPositionOnExpiration(
          mx,
          my,
          w,
          h,
          viewRef.current,
          posCurvesRef.current,
        );
      const setHover = (id: string | null) => {
        if (hoveredPosRef.current === id) return;
        hoveredPosRef.current = id;
        if (id) node.dataset.hoverPosition = id;
        else delete node.dataset.hoverPosition;
      };
      const onHoverMove = (e: PointerEvent) => {
        const rect = node.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const w = node.clientWidth;
        const h = node.clientHeight;
        const dragging =
          e.buttons !== 0 ||
          !!previewRef.current ||
          node.style.cursor === "grabbing";
        if (dragging) {
          if (trackRef.current || hoveredPosRef.current) {
            trackRef.current = null;
            setHover(null);
            drawRef.current();
          }
          return;
        }
        trackRef.current = inPlot(mx, my, w, h) ? { x: mx, y: my } : null;
        if (
          hitStrikeHandle(e, node, viewRef.current, handlesRef.current) !=
          null
        ) {
          setHover(null);
          drawRef.current();
          return;
        }
        const hit = trackRef.current ? hitPosition(mx, my, w, h) : null;
        setHover(hit?.id ?? null);
        if (node.style.cursor !== "grabbing") {
          node.style.cursor = hit ? "pointer" : "grab";
        }
        drawRef.current();
      };
      const onHoverLeave = () => {
        trackRef.current = null;
        setHover(null);
        if (node.style.cursor !== "grabbing") node.style.cursor = "grab";
        drawRef.current();
      };
      const onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const rect = node.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const w = node.clientWidth;
        const h = node.clientHeight;
        if (!inPlot(mx, my, w, h)) {
          setAlertMenu(null);
          return;
        }
        const price = toHostDataX(mx, w, viewRef.current);
        const hit = hitPosition(mx, my, w, h);
        if (hit) {
          setHover(hit.id);
          drawRef.current();
          setAlertMenu({
            x: mx,
            y: my,
            price,
            kind: "position",
            step: "condition",
            positionId: hit.id,
          });
          return;
        }
        setAlertMenu({
          x: mx,
          y: my,
          price,
          kind: "canvas",
          step: "condition",
        });
      };
      node.addEventListener("pointermove", onHoverMove);
      node.addEventListener("pointerleave", onHoverLeave);
      node.addEventListener("contextmenu", onContextMenu);
      const ro = new ResizeObserver(() => drawRef.current());
      ro.observe(node);
      const prev = unbindRef.current;
      unbindRef.current = () => {
        node.removeEventListener("pointermove", onHoverMove);
        node.removeEventListener("pointerleave", onHoverLeave);
        node.removeEventListener("contextmenu", onContextMenu);
        ro.disconnect();
        unbindStrikes();
        prev();
      };
      drawRef.current();
    }, []);

    const ensureBound = useCallback(() => {
      const node = hostRef.current;
      if (!node) return;
      if (!unbindRef.current || node.dataset.wheelBound !== "1") attach(node);
    }, [attach]);

    useEffect(() => {
      const onShow = () => {
        ensureBound();
        drawRef.current();
      };
      const onVis = () => {
        if (document.visibilityState === "visible") onShow();
      };
      window.addEventListener("pageshow", onShow);
      document.addEventListener("visibilitychange", onVis);
      return () => {
        window.removeEventListener("pageshow", onShow);
        document.removeEventListener("visibilitychange", onVis);
      };
    }, [ensureBound]);

    useEffect(() => {
      if (previewRef.current) {
        ensureBound();
        drawRef.current();
        return;
      }
      if (!userAdjustedRef.current) viewRef.current = fit();
      ensureBound();
      drawRef.current();
    }, [fit, draw, ensureBound]);

    const hitLabel =
      alertMenu?.kind === "position"
        ? positionAlertChoices.find((p) => p.id === alertMenu.positionId)
            ?.strikesLabel
        : null;

    return (
      <div
        ref={attach}
        data-testid="pnl-chart-host"
        className="relative h-full min-h-[240px] w-full"
        style={{ width: "100%", height: "100%", minHeight: 240 }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
        {alertMenu ? (
          <div
            aria-hidden
            data-testid="analyzer-alert-preview"
            className="pointer-events-none absolute z-40 w-0.5"
            style={{
              left: alertMenu.x,
              top: PAD.top,
              height: `calc(100% - ${PAD.top + PAD.bottom}px)`,
              background:
                "repeating-linear-gradient(to bottom, #f59e0b 0px, #f59e0b 4px, transparent 4px, transparent 8px)",
              opacity: 0.8,
            }}
          />
        ) : null}
        {alertMenu ? (
          <div
            className="absolute z-50 min-w-[13.5rem] rounded-lg border border-white/15 bg-[#1c1c24] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            style={{ left: alertMenu.x, top: alertMenu.y }}
            data-testid="analyzer-alert-menu"
            data-alert-kind={alertMenu.kind}
            data-alert-position={alertMenu.positionId ?? ""}
            onMouseLeave={() => setAlertMenu(null)}
          >
            <div className="border-b border-white/10 px-3 py-1.5 text-[11px] text-white/45">
              {alertMenu.kind === "position"
                ? hitLabel
                  ? `Position alert · ${hitLabel}`
                  : "Position alert"
                : `Price alert at ${alertMenu.price.toFixed(0)}`}
            </div>
            {(
              [
                ["price_above", "Alert when price rises above"],
                ["price_below", "Alert when price falls below"],
                ["price_touch", "Alert when price touches"],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                className="block w-full px-3 py-1.5 text-left text-[13px] text-white/90 hover:bg-white/10"
                onClick={() => {
                  if (alertMenu.kind === "position" && alertMenu.positionId) {
                    positionAlertRef.current?.(
                      alertMenu.positionId,
                      alertMenu.price,
                      type,
                    );
                  } else {
                    canvasAlertRef.current?.(alertMenu.price, type);
                  }
                  setAlertMenu(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);

export default HostPnLChart;
