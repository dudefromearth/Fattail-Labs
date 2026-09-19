"use client";

import { useEffect, type ReactNode } from "react";
import {
  AXIS_FONTS,
  AXIS_FONT_SIZES,
  LAYER_REGISTRY,
  lawfulFields,
  type CrosshairStyle,
  type SaPrefs,
} from "@/lib/saLayerStore";
import { SETTINGS_SECTIONS } from "@/lib/saSettingsSections";
import { asHex, SA_THEME } from "@/lib/saTheme";
import { useSaCanvas } from "./SaCanvasContext";

const FIELD =
  "h-9 min-w-[8.5rem] rounded-md border border-zinc-300 bg-white px-2 text-[13px] text-zinc-900";
const CHECK = "h-[18px] w-[18px] shrink-0 accent-zinc-900";
const RANGE = "w-full accent-zinc-900";

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
    <span className="inline-flex h-8 w-8 overflow-hidden rounded border border-zinc-300 bg-white">
      <input
        type="color"
        data-testid={testId}
        className="h-9 w-10 -m-0.5 cursor-pointer border-0 p-0"
        value={asHex(value, fallback)}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-4">
      <div className="text-[14px] text-zinc-900">{label}</div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
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
    open,
    ok,
    cancel,
    saveObjectDefault,
    resetToObjectDefault,
    resetPartToHouse,
  } = useSaCanvas();

  useEffect(() => {
    if (!openPart) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPart, cancel]);

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
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/35"
      data-testid="sa-settings-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div
        role="dialog"
        aria-labelledby="sa-settings-title"
        data-testid="sa-part-dialog"
        data-part={openPart}
        className="flex h-[min(640px,85vh)] w-[640px] max-w-[92vw] flex-col overflow-hidden rounded-lg bg-white text-zinc-900 shadow-2xl"
        style={{ fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex h-[52px] shrink-0 items-center justify-between px-5">
          <h2 id="sa-settings-title" className="text-[20px] font-semibold">
            Settings
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center text-2xl leading-none text-zinc-600"
            onClick={cancel}
          >
            ×
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav
            className="w-[148px] shrink-0 overflow-y-auto px-2 py-1"
            aria-label="Settings sections"
          >
            {SETTINGS_SECTIONS.map((s) => {
              const on = s.id === openPart;
              return (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`sa-settings-section-${s.id}`}
                  className={`flex h-12 w-full items-center rounded-full px-3 text-left text-[14px] ${
                    on ? "bg-zinc-100 font-medium" : "text-zinc-800 hover:bg-zinc-50"
                  }`}
                  onClick={() => open(s.id)}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto border-l border-zinc-200 px-6 py-3 text-[14px]">
            {def?.reserved ? (
              <p data-testid="sa-dialog-reserved">{def.note}</p>
            ) : null}

            {canToggle && canToggle !== "L0" ? (
              <Row
                label={
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className={CHECK}
                      data-testid="sa-dialog-primary-toggle"
                      checked={prefs.visible[canToggle]}
                      onChange={(e) => setVisible(canToggle, e.target.checked)}
                    />
                    Show {def?.label ?? "layer"}
                  </span>
                }
              >
                <span />
              </Row>
            ) : null}

            {has("canvasBg") ? (
              <Group label="Chart">
                <Row label="Background">
                  <Swatch
                    testId="sa-canvas-bg"
                    value={prefs.canvasBg}
                    fallback={SA_THEME.bg}
                    onChange={(v) => patch({ canvasBg: v })}
                  />
                </Row>
                <Row
                  label={
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={CHECK}
                        checked={prefs.vertGridOn}
                        onChange={(e) =>
                          patch({ vertGridOn: e.target.checked })
                        }
                      />
                      Vertical grid
                    </span>
                  }
                >
                  <Swatch
                    testId="sa-grid-color"
                    value={prefs.gridColor}
                    fallback={SA_THEME.grid}
                    onChange={(v) => patch({ gridColor: v })}
                  />
                </Row>
                <Row
                  label={
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={CHECK}
                        checked={prefs.horzGridOn}
                        onChange={(e) =>
                          patch({ horzGridOn: e.target.checked })
                        }
                      />
                      Horizontal grid
                    </span>
                  }
                >
                  <span />
                </Row>
                <Row label="Grid opacity">
                  <input
                    type="range"
                    min={0}
                    max={40}
                    data-testid="sa-grid-opacity"
                    value={Math.round((prefs.gridOpacity ?? 0.08) * 100)}
                    onChange={(e) =>
                      patch({ gridOpacity: Number(e.target.value) / 100 })
                    }
                    className={`${RANGE} w-40`}
                  />
                </Row>
                <Row label="Crosshair">
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
                </Row>
              </Group>
            ) : null}

            {has("axisFont") ? (
              <Group label="Scales">
                <Row label="Text">
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
                </Row>
                <Row label="Font">
                  <select
                    className={`${FIELD} max-w-[11rem]`}
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
                </Row>
                <Row label="Lines">
                  <Swatch
                    value={prefs.scaleLineColor}
                    fallback="#2b2b43"
                    onChange={(v) => patch({ scaleLineColor: v })}
                  />
                </Row>
              </Group>
            ) : null}

            {has("marginTop") ? (
              <Group label="Margins">
                <Row label="Top">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    className={`${FIELD} w-16 text-right`}
                    value={Math.round((prefs.marginTop ?? 0.05) * 100)}
                    onChange={(e) =>
                      patch({
                        marginTop:
                          Math.min(40, Math.max(0, Number(e.target.value) || 0)) /
                          100,
                      })
                    }
                  />
                  <span className="text-zinc-500">%</span>
                </Row>
                <Row label="Bottom">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    className={`${FIELD} w-16 text-right`}
                    value={Math.round((prefs.marginBottom ?? 0.05) * 100)}
                    onChange={(e) =>
                      patch({
                        marginBottom:
                          Math.min(40, Math.max(0, Number(e.target.value) || 0)) /
                          100,
                      })
                    }
                  />
                  <span className="text-zinc-500">%</span>
                </Row>
                <Row label="Right">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    className={`${FIELD} w-16 text-right`}
                    value={prefs.rightOffsetBars}
                    onChange={(e) =>
                      patch({
                        rightOffsetBars: Math.min(
                          40,
                          Math.max(0, Number(e.target.value) || 0),
                        ),
                      })
                    }
                  />
                  <span className="text-zinc-500">bars</span>
                </Row>
              </Group>
            ) : null}

            {has("priceFormat") ? (
              <Group label="Candles">
                <Row label="Format">
                  <select
                    className={FIELD}
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
                </Row>
                <Row
                  label={
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={CHECK}
                        checked={prefs.colorByPrevClose}
                        onChange={(e) =>
                          patch({ colorByPrevClose: e.target.checked })
                        }
                      />
                      Color bars based on previous close
                    </span>
                  }
                >
                  <span />
                </Row>
                <Row
                  label={
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={CHECK}
                        checked={prefs.candleBodyOn}
                        onChange={(e) =>
                          patch({ candleBodyOn: e.target.checked })
                        }
                      />
                      Body
                    </span>
                  }
                >
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
                </Row>
                <Row
                  label={
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={CHECK}
                        checked={prefs.candleBorderOn}
                        onChange={(e) =>
                          patch({ candleBorderOn: e.target.checked })
                        }
                      />
                      Borders
                    </span>
                  }
                >
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
                </Row>
                <Row
                  label={
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={CHECK}
                        checked={prefs.candleWickOn}
                        onChange={(e) =>
                          patch({ candleWickOn: e.target.checked })
                        }
                      />
                      Wick
                    </span>
                  }
                >
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
                </Row>
              </Group>
            ) : null}

            {has("orientation") ? (
              <Group label="Volume profile">
                <Row label="VP anchor">
                  <select
                    className={FIELD}
                    data-testid="sa-vp-anchor"
                    value={prefs.orientation}
                    onChange={(e) =>
                      patch({ orientation: e.target.value as "ltr" | "rtl" })
                    }
                  >
                    <option value="ltr">left</option>
                    <option value="rtl">right</option>
                  </select>
                </Row>
                <Row label="Width">
                  <input
                    type="range"
                    min={35}
                    max={75}
                    value={Math.round(prefs.profileWidthFrac * 100)}
                    onChange={(e) =>
                      patch({
                        profileWidthFrac: Number(e.target.value) / 100,
                      })
                    }
                    className={`${RANGE} w-40`}
                  />
                </Row>
                <Row label="Opacity">
                  <input
                    type="range"
                    min={35}
                    max={50}
                    value={Math.round((prefs.profileOpacity || 0.42) * 100)}
                    onChange={(e) =>
                      patch({
                        profileOpacity: Number(e.target.value) / 100,
                      })
                    }
                    className={`${RANGE} w-40`}
                  />
                </Row>
              </Group>
            ) : null}

            {has("axis") ? (
              <Group label="Price scale">
                <Row label="Scales placement">
                  <select
                    className={FIELD}
                    data-testid="sa-scale-side"
                    value={prefs.axis}
                    onChange={(e) =>
                      patch({
                        axis: e.target.value as "left" | "right" | "both",
                      })
                    }
                  >
                    <option value="left">left</option>
                    <option value="right">right</option>
                    <option value="both">both</option>
                  </select>
                </Row>
              </Group>
            ) : null}

            {has("lastPriceOn") ? (
              <Group label="Price labels and lines">
                <Row
                  label={
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={CHECK}
                        checked={prefs.lastPriceOn}
                        onChange={(e) =>
                          patch({ lastPriceOn: e.target.checked })
                        }
                      />
                      Last price
                    </span>
                  }
                >
                  <Swatch
                    value={prefs.lastPriceColor}
                    fallback="#26a69a"
                    onChange={(v) => patch({ lastPriceColor: v })}
                  />
                </Row>
                <Row
                  label={
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
                  }
                >
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
                </Row>
              </Group>
            ) : null}

            {has("legendOn") ? (
              <Row
                label={
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className={CHECK}
                      checked={prefs.legendOn}
                      onChange={(e) => patch({ legendOn: e.target.checked })}
                    />
                    Show legend
                  </span>
                }
              >
                <span />
              </Row>
            ) : null}

            {has("priceLookbackDays") ? (
              <Group label="Price layer">
                <Row label="Lookback (days)">
                  <input
                    type="number"
                    min={1}
                    max={1096}
                    className={`${FIELD} w-20`}
                    value={prefs.priceLookbackDays}
                    onChange={(e) =>
                      patch({
                        priceLookbackDays: Number(e.target.value) || 5,
                      })
                    }
                  />
                </Row>
                <p className="text-[12px] text-zinc-500">
                  Moves the price layer only — profile stays full-history (A12).
                </p>
              </Group>
            ) : null}

            {openPart === "L3" && fields.length <= 1 ? (
              <p className="text-zinc-500">Visibility only — no extra settings (A7).</p>
            ) : null}
          </div>
        </div>

        <footer className="flex h-14 shrink-0 items-center justify-between border-t border-zinc-200 px-4">
          <select
            className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-[13px] text-zinc-900"
            data-testid="sa-defaults-menu"
            value=""
            onChange={(e) => {
              const v = e.target.value;
              e.currentTarget.value = "";
              if (v === "morning" || v === "entry" || v === "management") {
                setMode(v);
                return;
              }
              if (v === "save") saveObjectDefault(openPart);
              if (v === "reset") resetToObjectDefault(openPart);
              if (v === "house") resetPartToHouse(openPart);
              if (v === "reset-mode") resetMode();
            }}
          >
            <option value="" disabled>
              Template
            </option>
            <option value="morning">Morning</option>
            <option value="entry">Entry</option>
            <option value="management">Management</option>
            <option value="save">Save as default</option>
            <option value="reset">Reset to default</option>
            <option value="house">Reset to house default</option>
            <option value="reset-mode">Reset this mode to house</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="sa-settings-cancel"
              className="h-9 rounded-md border border-zinc-300 bg-white px-4 text-[13px] text-zinc-900"
              onClick={cancel}
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="sa-settings-ok"
              className="h-9 rounded-md bg-zinc-900 px-4 text-[13px] font-medium text-white"
              onClick={ok}
            >
              Ok
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
