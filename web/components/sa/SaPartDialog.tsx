"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AXIS_FONTS,
  AXIS_FONT_SIZES,
  LAYER_REGISTRY,
  lawfulFields,
  type CrosshairStyle,
  type DialogPart,
  type SaPrefs,
} from "@/lib/saLayerStore";
import { asHex, SA_THEME } from "@/lib/saTheme";
import { useSaCanvas } from "./SaCanvasContext";

const TITLES: Record<DialogPart, string> = {
  L0: "Canvas",
  L1: "Price",
  L2: "Profile",
  L3: "Analysis",
  L4: "Footprint",
  LP: "Position",
  axis: "Scales and lines",
  grid: "Grid",
  legend: "Legend",
  chips: "Provenance",
  range: "Price span",
  mode: "Mode",
};

const FIELD =
  "rounded border border-zinc-500 bg-[#131722] px-1.5 py-0.5 text-[11px] text-zinc-200";
const CHECK = "h-3.5 w-3.5 shrink-0 accent-zinc-200";
const RANGE = "w-full accent-zinc-300";

function Swatch({
  value,
  fallback,
  testId,
  onChange,
}: {
  value: string;
  fallback: string;
  testId?: string;
  onChange: (v: string) => void;
}) {
  return (
    <span className="inline-flex h-7 w-8 overflow-hidden rounded border border-zinc-400 bg-zinc-800">
      <input
        type="color"
        data-testid={testId}
        className="h-8 w-10 -m-0.5 cursor-pointer border-0 p-0"
        value={asHex(value, fallback)}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function SaPartDialog() {
  const {
    prefs,
    patch,
    setVisible,
    setMode,
    resetMode,
    openPart,
    close,
    saveObjectDefault,
    resetToObjectDefault,
    resetPartToHouse,
  } = useSaCanvas();
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  if (!openPart) return null;
  const def = LAYER_REGISTRY.find((L) => L.id === openPart);
  const fields = lawfulFields(openPart);
  const has = (k: string) => fields.includes(k);
  const canToggle =
    def && !def.reserved && openPart.startsWith("L")
      ? (openPart as "L0" | "L1" | "L2" | "L3" | "L4")
      : null;

  return (
    <div
      ref={box}
      data-testid="sa-part-dialog"
      data-part={openPart}
      className="absolute z-30 w-72 rounded border border-zinc-500 bg-[#1e222d] text-zinc-200 shadow-lg"
      style={{
        left: prefs.dialogPos.x,
        top: prefs.dialogPos.y,
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: 13,
        color: "#d1d4dc",
        background: "#1e222d",
      }}
    >
      <header
        className="flex cursor-move items-center gap-2 border-b border-zinc-600 px-2 py-1.5"
        onMouseDown={(e) => {
          drag.current = {
            dx: e.clientX - prefs.dialogPos.x,
            dy: e.clientY - prefs.dialogPos.y,
          };
          const move = (ev: MouseEvent) => {
            if (!drag.current) return;
            patch({
              dialogPos: {
                x: Math.max(8, ev.clientX - drag.current.dx),
                y: Math.max(8, ev.clientY - drag.current.dy),
              },
            });
          };
          const up = () => {
            drag.current = null;
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
          };
          window.addEventListener("mousemove", move);
          window.addEventListener("mouseup", up);
        }}
      >
        <span className="text-xs font-semibold text-zinc-100">
          {TITLES[openPart]}
        </span>
        {canToggle ? (
          <button
            type="button"
            className="ml-auto h-6 rounded border border-zinc-500 px-2 text-[11px] text-zinc-200"
            data-testid="sa-dialog-primary-toggle"
            onClick={() => setVisible(canToggle, !prefs.visible[canToggle])}
          >
            {prefs.visible[canToggle] ? "on" : "off"}
          </button>
        ) : (
          <span className="ml-auto" />
        )}
        <button
          type="button"
          aria-label="Close"
          className="h-6 w-6 text-zinc-400"
          onClick={close}
        >
          ×
        </button>
      </header>
      <div className="max-h-[28rem] space-y-3 overflow-y-auto px-2 py-2 text-[11px] text-zinc-200">
        {def?.reserved ? (
          <p data-testid="sa-dialog-reserved">{def.note}</p>
        ) : null}

        {has("canvasBg") ? (
          <Section label="Chart">
            <label className="flex items-center justify-between gap-2">
              Background
              <Swatch
                testId="sa-canvas-bg"
                value={prefs.canvasBg}
                fallback={SA_THEME.bg}
                onChange={(v) => patch({ canvasBg: v })}
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className={CHECK}
                  checked={prefs.vertGridOn}
                  onChange={(e) => patch({ vertGridOn: e.target.checked })}
                />
                Vertical grid
              </span>
              <Swatch
                testId="sa-grid-color"
                value={prefs.gridColor}
                fallback={SA_THEME.grid}
                onChange={(v) => patch({ gridColor: v })}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className={CHECK}
                checked={prefs.horzGridOn}
                onChange={(e) => patch({ horzGridOn: e.target.checked })}
              />
              Horizontal grid
            </label>
            <label className="block">
              Grid opacity
              <input
                type="range"
                min={0}
                max={40}
                data-testid="sa-grid-opacity"
                value={Math.round((prefs.gridOpacity ?? 0.08) * 100)}
                onChange={(e) =>
                  patch({ gridOpacity: Number(e.target.value) / 100 })
                }
                className={RANGE}
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              Crosshair
              <span className="flex items-center gap-1">
                <Swatch
                  value={prefs.crosshairColor}
                  fallback="#758696"
                  onChange={(v) => patch({ crosshairColor: v })}
                />
                <select
                  className={FIELD}
                  value={prefs.crosshairStyle}
                  onChange={(e) =>
                    patch({
                      crosshairStyle: e.target.value as CrosshairStyle,
                    })
                  }
                >
                  <option value="solid">solid</option>
                  <option value="dotted">dotted</option>
                  <option value="dashed">dashed</option>
                  <option value="largeDashed">large dash</option>
                </select>
              </span>
            </label>
          </Section>
        ) : null}

        {has("axisFont") ? (
          <Section label="Scales">
            <label className="flex items-center justify-between gap-2">
              Text
              <span className="flex items-center gap-1">
                <Swatch
                  value={prefs.axisTextColor}
                  fallback="#d1d4dc"
                  onChange={(v) => patch({ axisTextColor: v })}
                />
                <select
                  className={FIELD}
                  data-testid="sa-axis-font-size"
                  value={prefs.axisFontSize}
                  onChange={(e) =>
                    patch({ axisFontSize: Number(e.target.value) })
                  }
                >
                  {AXIS_FONT_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              Font
              <select
                className={`${FIELD} max-w-[9rem]`}
                data-testid="sa-axis-font"
                value={prefs.axisFont}
                onChange={(e) => patch({ axisFont: e.target.value })}
              >
                {AXIS_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">
              Lines
              <Swatch
                value={prefs.scaleLineColor}
                fallback="#2b2b43"
                onChange={(v) => patch({ scaleLineColor: v })}
              />
            </label>
          </Section>
        ) : null}

        {has("marginTop") ? (
          <Section label="Margins">
            <label className="flex items-center justify-between gap-2">
              Top
              <span>
                <input
                  type="number"
                  min={0}
                  max={40}
                  className={`${FIELD} w-12 text-right`}
                  value={Math.round((prefs.marginTop ?? 0.05) * 100)}
                  onChange={(e) =>
                    patch({
                      marginTop: Math.min(40, Math.max(0, Number(e.target.value) || 0)) / 100,
                    })
                  }
                />{" "}
                %
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              Bottom
              <span>
                <input
                  type="number"
                  min={0}
                  max={40}
                  className={`${FIELD} w-12 text-right`}
                  value={Math.round((prefs.marginBottom ?? 0.05) * 100)}
                  onChange={(e) =>
                    patch({
                      marginBottom:
                        Math.min(40, Math.max(0, Number(e.target.value) || 0)) /
                        100,
                    })
                  }
                />{" "}
                %
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              Right
              <span>
                <input
                  type="number"
                  min={0}
                  max={40}
                  className={`${FIELD} w-12 text-right`}
                  value={prefs.rightOffsetBars}
                  onChange={(e) =>
                    patch({
                      rightOffsetBars: Math.min(
                        40,
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                    })
                  }
                />{" "}
                bars
              </span>
            </label>
          </Section>
        ) : null}

        {has("priceFormat") ? (
          <Section label="Candles">
            <label className="block">
              Format
              <select
                className={`ml-1 ${FIELD}`}
                value={prefs.priceFormat}
                onChange={(e) =>
                  patch({
                    priceFormat: e.target.value as SaPrefs["priceFormat"],
                  })
                }
              >
                <option value="candle">candle</option>
                <option value="bar">bar</option>
                <option value="line">line</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className={CHECK}
                checked={prefs.colorByPrevClose}
                onChange={(e) => patch({ colorByPrevClose: e.target.checked })}
              />
              Color bars based on previous close
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className={CHECK}
                  checked={prefs.candleBodyOn}
                  onChange={(e) => patch({ candleBodyOn: e.target.checked })}
                />
                Body
              </span>
              <span className="flex gap-1">
                <Swatch
                  value={prefs.candleUp}
                  fallback="#26a69a"
                  onChange={(v) => patch({ candleUp: v })}
                />
                <Swatch
                  value={prefs.candleDown}
                  fallback="#ef5350"
                  onChange={(v) => patch({ candleDown: v })}
                />
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className={CHECK}
                  checked={prefs.candleBorderOn}
                  onChange={(e) => patch({ candleBorderOn: e.target.checked })}
                />
                Borders
              </span>
              <span className="flex gap-1">
                <Swatch
                  value={prefs.borderUp}
                  fallback="#26a69a"
                  onChange={(v) => patch({ borderUp: v })}
                />
                <Swatch
                  value={prefs.borderDown}
                  fallback="#ef5350"
                  onChange={(v) => patch({ borderDown: v })}
                />
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className={CHECK}
                  checked={prefs.candleWickOn}
                  onChange={(e) => patch({ candleWickOn: e.target.checked })}
                />
                Wick
              </span>
              <span className="flex gap-1">
                <Swatch
                  value={prefs.wickUp}
                  fallback="#26a69a"
                  onChange={(v) => patch({ wickUp: v })}
                />
                <Swatch
                  value={prefs.wickDown}
                  fallback="#ef5350"
                  onChange={(v) => patch({ wickDown: v })}
                />
              </span>
            </label>
          </Section>
        ) : null}

        {has("orientation") ? (
          <label className="block">
            VP anchor
            <select
              className={`ml-1 ${FIELD}`}
              data-testid="sa-vp-anchor"
              value={prefs.orientation}
              onChange={(e) =>
                patch({ orientation: e.target.value as "ltr" | "rtl" })
              }
            >
              <option value="ltr">left</option>
              <option value="rtl">right</option>
            </select>
          </label>
        ) : null}
        {has("axis") ? (
          <Section label="Price scale">
            <label className="block">
              Scales placement
              <select
                className={`ml-1 ${FIELD}`}
                data-testid="sa-scale-side"
                value={prefs.axis}
                onChange={(e) =>
                  patch({ axis: e.target.value as "left" | "right" | "both" })
                }
              >
                <option value="left">left</option>
                <option value="right">right</option>
                <option value="both">both</option>
              </select>
            </label>
          </Section>
        ) : null}

        {has("lastPriceOn") ? (
          <Section label="Price labels and lines">
            <label className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className={CHECK}
                  checked={prefs.lastPriceOn}
                  onChange={(e) => patch({ lastPriceOn: e.target.checked })}
                />
                Last price
              </span>
              <Swatch
                value={prefs.lastPriceColor}
                fallback="#26a69a"
                onChange={(v) => patch({ lastPriceColor: v })}
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className={CHECK}
                  data-testid="sa-hilo-on"
                  checked={prefs.hiLoOn}
                  onChange={(e) => patch({ hiLoOn: e.target.checked })}
                />
                High and low
              </span>
              <span className="flex gap-1">
                <Swatch
                  testId="sa-hi-color"
                  value={prefs.hiColor}
                  fallback="#4caf50"
                  onChange={(v) => patch({ hiColor: v })}
                />
                <Swatch
                  testId="sa-lo-color"
                  value={prefs.loColor}
                  fallback="#ef5350"
                  onChange={(v) => patch({ loColor: v })}
                />
              </span>
            </label>
          </Section>
        ) : null}

        {has("legendOn") ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className={CHECK}
              checked={prefs.legendOn}
              onChange={(e) => patch({ legendOn: e.target.checked })}
            />
            Show legend
          </label>
        ) : null}
        {has("priceLookbackDays") ? (
          <label className="block">
            Price-layer lookback (days)
            <input
              type="number"
              min={1}
              max={1096}
              className={`ml-1 w-16 ${FIELD}`}
              value={prefs.priceLookbackDays}
              onChange={(e) =>
                patch({ priceLookbackDays: Number(e.target.value) || 5 })
              }
            />
            <span className="mt-1 block text-[10px] text-zinc-400">
              Moves the price layer only — profile stays full-history (A12).
            </span>
          </label>
        ) : null}
        {has("profileWidthFrac") ? (
          <label className="block">
            Width
            <input
              type="range"
              min={35}
              max={75}
              value={Math.round(prefs.profileWidthFrac * 100)}
              onChange={(e) =>
                patch({ profileWidthFrac: Number(e.target.value) / 100 })
              }
              className={RANGE}
            />
          </label>
        ) : null}
        {has("profileOpacity") ? (
          <label className="block">
            Opacity
            <input
              type="range"
              min={35}
              max={50}
              value={Math.round((prefs.profileOpacity || 0.42) * 100)}
              onChange={(e) =>
                patch({ profileOpacity: Number(e.target.value) / 100 })
              }
              className={RANGE}
            />
          </label>
        ) : null}
        {has("mode") ? (
          <div className="space-y-1">
            <p className="text-zinc-400">
              House defaults stubbed until Coach tunes.
            </p>
            {(["morning", "entry", "management"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`mr-1 rounded px-2 py-0.5 ${
                  prefs.mode === m ? "bg-zinc-200 text-zinc-900" : "border border-zinc-600"
                }`}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
            <button type="button" className="block underline" onClick={resetMode}>
              Reset this mode to house
            </button>
          </div>
        ) : null}
        {fields.length === 0 && !def?.reserved ? (
          <p className="text-zinc-400">
            Display only — no extra settings (A7).
          </p>
        ) : null}
      </div>
      <footer className="border-t border-zinc-700 px-2 py-1.5">
        <select
          className={`w-full ${FIELD}`}
          data-testid="sa-defaults-menu"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            e.currentTarget.value = "";
            if (v === "save") saveObjectDefault(openPart);
            if (v === "reset") resetToObjectDefault(openPart);
            if (v === "house") resetPartToHouse(openPart);
          }}
        >
          <option value="" disabled>
            Defaults
          </option>
          <option value="save">Save as default</option>
          <option value="reset">Reset to default</option>
          <option value="house">Reset to house default</option>
        </select>
      </footer>
    </div>
  );
}
