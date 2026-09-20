/** Map L0/L1/axis prefs → LWC option bags. Guest applies; createChart stays stock. */
import {
  ColorType,
  LineStyle,
  type CandlestickData,
} from "lightweight-charts";
import { hexToRgba, SA_THEME } from "./saTheme";
import type { CrosshairStyle, SaPrefs } from "./saLayerStore";

const STYLE: Record<CrosshairStyle, LineStyle> = {
  solid: LineStyle.Solid,
  dotted: LineStyle.Dotted,
  dashed: LineStyle.Dashed,
  largeDashed: LineStyle.LargeDashed,
};

export function lineStyleOf(s: CrosshairStyle | undefined): LineStyle {
  return STYLE[s || "largeDashed"];
}

export function canvasOptions(prefs: SaPrefs) {
  const bg = prefs.canvasBg || SA_THEME.bg;
  const grid = hexToRgba(
    prefs.gridColor || SA_THEME.grid,
    prefs.gridOpacity ?? SA_THEME.gridOpacity,
  );
  const vert = prefs.vertGridOn !== false && (prefs.gridOpacity ?? 0) > 0;
  const horz = prefs.horzGridOn !== false && (prefs.gridOpacity ?? 0) > 0;
  const family = `"${prefs.axisFont || "Trebuchet MS"}", "Segoe UI", sans-serif`;
  return {
    layout: {
      background: { type: ColorType.Solid, color: bg },
      textColor: prefs.axisTextColor || SA_THEME.axisText || "#d1d4dc",
      fontSize: prefs.axisFontSize || 12,
      fontFamily: family,
    },
    grid: {
      vertLines: { color: grid, visible: vert },
      horzLines: { color: grid, visible: horz },
    },
    crosshair: {
      vertLine: {
        color: prefs.crosshairColor || "#758696",
        style: lineStyleOf(prefs.crosshairStyle),
      },
      horzLine: {
        color: prefs.crosshairColor || "#758696",
        style: lineStyleOf(prefs.crosshairStyle),
      },
    },
    timeScale: {
      rightOffset: prefs.rightOffsetBars ?? 5,
      borderColor: prefs.scaleLineColor || "#2b2b43",
      timeVisible: true,
      // N-bar lookback (REQ-006): default minBarSpacing 0.5 clips a full page
      // when zoomed out.
      minBarSpacing: 0.05,
    },
    leftPriceScale: {
      visible: prefs.axis === "left" || prefs.axis === "both",
      borderColor: prefs.scaleLineColor || "#2b2b43",
      scaleMargins: {
        top: prefs.marginTop ?? 0.05,
        bottom: prefs.marginBottom ?? 0.05,
      },
    },
    rightPriceScale: {
      visible: prefs.axis === "right" || prefs.axis === "both",
      borderColor: prefs.scaleLineColor || "#2b2b43",
      scaleMargins: {
        top: prefs.marginTop ?? 0.05,
        bottom: prefs.marginBottom ?? 0.05,
      },
    },
  };
}

export function candleOptions(prefs: SaPrefs) {
  const hollow = prefs.candleBodyOn === false;
  return {
    upColor: hollow ? "rgba(0,0,0,0)" : prefs.candleUp,
    downColor: hollow ? "rgba(0,0,0,0)" : prefs.candleDown,
    borderVisible: prefs.candleBorderOn !== false,
    borderUpColor: prefs.borderUp,
    borderDownColor: prefs.borderDown,
    wickVisible: prefs.candleWickOn !== false,
    wickUpColor: prefs.wickUp,
    wickDownColor: prefs.wickDown,
    lastValueVisible: prefs.lastPriceOn !== false,
    priceLineVisible: false,
    priceScaleId: prefs.axis === "right" ? "right" : "left",
  };
}

/** L2 shares L1's price scale (right-scale bind is hidden when the axis is left). */
export function vpSeriesOptions(prefs: SaPrefs) {
  return {
    lastValueVisible: false,
    priceLineVisible: false,
    priceScaleId: prefs.axis === "right" ? "right" : "left",
    visible: prefs.visible.L2 !== false,
  };
}

export function colorBars(
  bars: CandlestickData[],
  prefs: SaPrefs,
): CandlestickData[] {
  if (!prefs.colorByPrevClose) return bars;
  return bars.map((b, i) => {
    const prev = i > 0 ? bars[i - 1] : b;
    const up = b.close >= prev.close;
    const fill = up ? prefs.candleUp : prefs.candleDown;
    const border = up ? prefs.borderUp : prefs.borderDown;
    const wick = up ? prefs.wickUp : prefs.wickDown;
    return {
      ...b,
      color: prefs.candleBodyOn === false ? "rgba(0,0,0,0)" : fill,
      borderColor: border,
      wickColor: wick,
    };
  });
}

export function visibleHiLo(
  bars: CandlestickData[],
  from: number,
  to: number,
): { hi: number; lo: number } | null {
  let hi = -Infinity;
  let lo = Infinity;
  for (const b of bars) {
    const t = typeof b.time === "number" ? b.time : 0;
    if (t < from || t > to) continue;
    if (b.high > hi) hi = b.high;
    if (b.low < lo) lo = b.low;
  }
  if (!Number.isFinite(hi) || !Number.isFinite(lo)) return null;
  return { hi, lo };
}
