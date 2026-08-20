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
  type HostView,
} from "@/lib/risk-graph/chartHostBind";
import type { PnLPoint, PnLChartHandle } from "@/lib/risk-graph/pnlChartTypes";

const PAD = { top: 40, right: 20, bottom: 50, left: 60 };

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
      ctx.fillStyle = "#0a0a0e";
      ctx.fillRect(PAD.left, PAD.top, cw, ch);

      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.font = "13px ui-monospace, monospace";
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
      strokeSeries(expiredExpirationData, "#3b82f6", 1.5);
      ctx.globalAlpha = 1;
      strokeSeries(expirationData, "#3b82f6", 2);
      strokeSeries(theoreticalData, theoreticalStroke, 2);

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "left";
      ctx.fillText("At expiry", PAD.left + 8, PAD.top + 12);
      ctx.fillStyle = theoreticalStroke;
      ctx.fillText(theoreticalLegendLabel, PAD.left + 8, PAD.top + 28);
    }, [
      expirationData,
      theoreticalData,
      expiredExpirationData,
      spotPrice,
      spotIndicatorPrice,
      theoreticalStroke,
      theoreticalLegendLabel,
    ]);

    drawRef.current = draw;
    const fitRef = useRef(fit);
    fitRef.current = fit;

    const attach = useCallback((node: HTMLDivElement | null) => {
      if (unbindRef.current && hostRef.current === node) return;
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

    useEffect(() => {
      const onShow = () => {
        const node = hostRef.current;
        if (!node) return;
        if (!unbindRef.current) attach(node);
        else drawRef.current();
      };
      const onVis = () => {
        if (document.visibilityState === "visible") onShow();
      };
      window.addEventListener("pageshow", onShow);
      document.addEventListener("visibilitychange", onVis);
      return () => {
        window.removeEventListener("pageshow", onShow);
        document.removeEventListener("visibilitychange", onVis);
        unbindRef.current?.();
        unbindRef.current = null;
      };
    }, [attach]);

    useEffect(() => {
      if (!userAdjustedRef.current) viewRef.current = fit();
      drawRef.current();
    }, [fit, draw]);

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
