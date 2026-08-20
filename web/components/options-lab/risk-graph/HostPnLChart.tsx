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
} from "react";
import {
  atmCenteredXRange,
  fitPnlYRange,
  AUTOFIT_PAD_FRAC,
  EXP_BREAKEVEN_MAX_VIEWPORT_FRAC,
} from "@/lib/risk-graph/pricing/autofitView";
import { clampAxisRange } from "@/lib/risk-graph/pnlChartViewPolicy";
import {
  bindChartHost,
  CHART_HOST_PAD,
  type HostView,
} from "@/lib/risk-graph/chartHostBind";
import type { PnLPoint, PnLChartHandle } from "@/lib/risk-graph/pnlChartTypes";
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
        ctx.rect(PAD.left, 0, cw, height);
        ctx.clip();
        const fills = ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.10)"];
        rangeBands.forEach((b, i) => {
          if (!(b.hi > b.lo) || !Number.isFinite(b.lo) || !Number.isFinite(b.hi)) {
            return;
          }
          const x0 = toX(b.lo);
          const x1 = toX(b.hi);
          ctx.fillStyle = fills[Math.min(i, fills.length - 1)];
          ctx.fillRect(x0, 0, Math.max(0, x1 - x0), height);
        });
        ctx.restore();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.font = AXIS_FONT;
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const yStep = niceStep(yMax - yMin, 6);
      const y0 = Math.ceil(yMin / yStep) * yStep;
      for (let y = y0; y <= yMax; y += yStep) {
        const cy = toY(y);
        ctx.beginPath();
        ctx.moveTo(PAD.left, cy);
        ctx.lineTo(width - PAD.right, cy);
        ctx.stroke();
        const lab = y >= 0 ? `+$${y.toFixed(0)}` : `-$${Math.abs(y).toFixed(0)}`;
        ctx.fillText(lab, PAD.left - 6, cy);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const xStep = niceStep(xMax - xMin, 8);
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

      ctx.font = "13px ui-monospace, monospace";
      ctx.fillStyle = "#22d3ee";
      ctx.textAlign = "left";
      ctx.fillText("At expiry", PAD.left + 8, PAD.top + 12);
      ctx.fillStyle = theoreticalStroke;
      ctx.fillText(theoreticalLegendLabel, PAD.left + 8, PAD.top + 28);
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
      unbindRef.current = bindChartHost({
        host: node,
        view: viewRef,
        userAdjusted: userAdjustedRef,
        draw: () => drawRef.current(),
      });
      const ro = new ResizeObserver(() => drawRef.current());
      ro.observe(node);
      const prev = unbindRef.current;
      unbindRef.current = () => {
        ro.disconnect();
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
      if (!userAdjustedRef.current) viewRef.current = fit();
      ensureBound();
      drawRef.current();
    }, [fit, draw, ensureBound]);

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
      </div>
    );
  },
);

export default HostPnLChart;
