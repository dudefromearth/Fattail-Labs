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
import {
  SETTINGS_SECTIONS,
  type SettingsSectionIcon,
} from "@/lib/saSettingsSections";
import { asHex, SA_THEME } from "@/lib/saTheme";
import { IconChevronDown, IconXMark } from "@/components/ui/icons";
import { useSaCanvas } from "./SaCanvasContext";

/**
 * REQ-002 v2 — CSS px from reference PNG blob bf9fa21… (2× capture).
 * Measurement: artifacts/references/REQ-002-measurement-spec.md
 * PNG wins if a number is disputed.
 */
const DLG_W = 753;
const DLG_H = 1105;
const SIDEBAR_W = 220;
const TITLE_H = 56;
const FOOTER_H = 66;
const ITEM_H = 40;
const ROW_H = 48;
const CTRL_H = 36;
const SWATCH = 32;
const CHECK = 18;
const SELECTED = "#efefef";
const HAIRLINE = "#e6e6e6";
const BORDER = "#c4c4c4";
const INK = "#000000";
const MUTED = "#8e8e93";
const PILL_INSET = 8;

const SELECT =
  "min-w-[10.5rem] appearance-none rounded-lg border bg-white pl-3 pr-8 text-[14px]";
const INPUT = "rounded-lg border bg-white px-2.5 text-[14px] text-right";

function SectionIcon({
  name,
  className,
}: {
  name: SettingsSectionIcon;
  className?: string;
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "canvas":
      return (
        <svg {...common}>
          <path d="M4 20l4.2-1.1L19 8.1a2.1 2.1 0 0 0-3-3L5.3 15.8 4 20z" />
          <path d="M13.8 6.2l3.9 3.9" />
        </svg>
      );
    case "price":
      return (
        <svg {...common}>
          <path d="M8 4v16" />
          <rect x="5.5" y="8" width="5" height="8" rx="0.6" fill="currentColor" stroke="none" />
          <path d="M16 3v18" />
          <rect x="13.5" y="7" width="5" height="7" rx="0.6" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <path d="M4 7h12M4 11h16M4 15h9M4 19h13" />
        </svg>
      );
    case "analysis":
      return (
        <svg {...common}>
          <path d="M4 17l5-5 3.5 3.5L20 7" />
          <path d="M15 7h5v5" />
        </svg>
      );
    case "axis":
      return (
        <svg {...common}>
          <path d="M7 5v14" />
          <path d="M4.5 7.5L7 5l2.5 2.5" />
          <path d="M4.5 16.5L7 19l2.5-2.5" />
          <path d="M11 9h9M11 15h6" />
        </svg>
      );
    case "legend":
      return (
        <svg {...common}>
          <path d="M5 8h14M5 12h14M5 16h10" />
        </svg>
      );
    case "range":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 4v4M16 4v4M4 11h16" />
        </svg>
      );
    default:
      return null;
  }
}

function SelectWrap({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex shrink-0 items-center ${className}`}>
      {children}
      <IconChevronDown
        size={16}
        className="pointer-events-none absolute right-2 text-black"
      />
    </span>
  );
}

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
    <span
      className="inline-flex shrink-0 overflow-hidden rounded border bg-white"
      style={{
        width: SWATCH,
        height: SWATCH,
        borderColor: BORDER,
      }}
    >
      <input
        type="color"
        data-testid={testId}
        className="cursor-pointer border-0 p-0"
        style={{
          width: SWATCH + 8,
          height: SWATCH + 8,
          margin: -4,
        }}
        value={asHex(value, fallback)}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

function LinePreview({
  color,
  style,
}: {
  color: string;
  style: CrosshairStyle;
}) {
  const dash =
    style === "dotted"
      ? "2 3"
      : style === "dashed"
        ? "6 4"
        : style === "largeDashed"
          ? "12 6"
          : undefined;
  return (
    <svg width="36" height={SWATCH} aria-hidden className="shrink-0">
      <line
        x1="4"
        y1={SWATCH / 2}
        x2="32"
        y2={SWATCH / 2}
        stroke={color || "#758696"}
        strokeWidth="2"
        strokeDasharray={dash}
      />
    </svg>
  );
}

function SwatchLine({
  color,
  fallback,
  style,
  testId,
  onChange,
}: {
  color: string;
  fallback: string;
  style: CrosshairStyle;
  testId?: string;
  onChange: (v: string) => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg border bg-white pl-1 pr-1.5"
      style={{ height: CTRL_H, borderColor: BORDER }}
    >
      <Swatch value={color} fallback={fallback} testId={testId} onChange={onChange} />
      <LinePreview color={asHex(color, fallback)} style={style} />
    </span>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pt-5 first:pt-1">
      <p
        className="mb-1 text-[12px] font-medium tracking-[0.08em] text-[#8e8e93]"
        style={{ fontVariant: "all-small-caps" }}
      >
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
    <div
      className="flex items-center justify-between gap-4"
      style={{ minHeight: ROW_H }}
    >
      <div className="text-[15px] leading-snug text-black">{label}</div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function CheckLabel({
  checked,
  onChange,
  children,
  testId,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <label className="flex items-center gap-3 text-[15px] text-black">
      <input
        type="checkbox"
        data-testid={testId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="shrink-0 rounded-[3px] border-black accent-black"
        style={{ width: CHECK, height: CHECK }}
      />
      {children}
    </label>
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

  const selectStyle = {
    height: CTRL_H,
    borderColor: BORDER,
    color: INK,
  };

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
        aria-modal="true"
        aria-labelledby="sa-settings-title"
        data-testid="sa-part-dialog"
        data-part={openPart}
        data-clause5="white-black"
        className="flex max-h-[92vh] max-w-[96vw] flex-col overflow-hidden bg-white text-black shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
        style={{
          width: DLG_W,
          height: `min(${DLG_H}px, 92vh)`,
          fontFamily: "var(--font-ui)",
          color: INK,
          background: "#ffffff",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header
          className="flex shrink-0 items-center justify-between px-6"
          style={{ height: TITLE_H }}
        >
          <h2
            id="sa-settings-title"
            className="text-[22px] font-semibold tracking-tight text-black"
          >
            Settings
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center text-black"
            onClick={cancel}
          >
            <IconXMark size={18} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav
            className="shrink-0 overflow-y-auto py-1"
            aria-label="Settings sections"
            style={{ width: SIDEBAR_W, paddingLeft: PILL_INSET, paddingRight: PILL_INSET }}
          >
            {SETTINGS_SECTIONS.map((s) => {
              const on = s.id === openPart;
              return (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`sa-settings-section-${s.id}`}
                  aria-current={on ? "page" : undefined}
                  className="flex w-full items-center gap-3 rounded-full px-3 text-left text-[15px] text-black"
                  style={{
                    height: ITEM_H,
                    background: on ? SELECTED : "transparent",
                    fontWeight: on ? 500 : 400,
                  }}
                  onClick={() => open(s.id)}
                >
                  <SectionIcon name={s.icon} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-8 pb-4 pt-1 text-[15px]"
            data-testid="sa-settings-pane"
          >
            {def?.reserved ? (
              <p data-testid="sa-dialog-reserved">{def.note}</p>
            ) : null}

            {canToggle && canToggle !== "L0" ? (
              <Row
                label={
                  <CheckLabel
                    testId="sa-dialog-primary-toggle"
                    checked={prefs.visible[canToggle]}
                    onChange={(v) => setVisible(canToggle, v)}
                  >
                    Show {def?.label ?? "layer"}
                  </CheckLabel>
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
                    <CheckLabel
                      checked={prefs.vertGridOn}
                      onChange={(v) => patch({ vertGridOn: v })}
                    >
                      Vertical grid
                    </CheckLabel>
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
                    <CheckLabel
                      checked={prefs.horzGridOn}
                      onChange={(v) => patch({ horzGridOn: v })}
                    >
                      Horizontal grid
                    </CheckLabel>
                  }
                >
                  <span />
                </Row>
                <Row label="Grid opacity">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    data-testid="sa-grid-opacity"
                    value={Math.round((prefs.gridOpacity ?? 0.08) * 100)}
                    onChange={(e) =>
                      patch({ gridOpacity: Number(e.target.value) / 100 })
                    }
                    className={INPUT}
                    style={{ ...selectStyle, width: 72 }}
                  />
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    %
                  </span>
                </Row>
                <Row label="Crosshair">
                  <SelectWrap>
                    <select
                      className={SELECT}
                      style={selectStyle}
                      value={prefs.crosshairStyle}
                      onChange={(e) =>
                        patch({
                          crosshairStyle: e.target.value as CrosshairStyle,
                        })
                      }
                    >
                      <option value="solid">Solid</option>
                      <option value="dotted">Dotted</option>
                      <option value="dashed">Dashed</option>
                      <option value="largeDashed">Large dash</option>
                    </select>
                  </SelectWrap>
                  <SwatchLine
                    color={prefs.crosshairColor}
                    fallback="#758696"
                    style={prefs.crosshairStyle}
                    onChange={(v) => patch({ crosshairColor: v })}
                  />
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
                  <SelectWrap>
                    <select
                      className={SELECT}
                      data-testid="sa-axis-font-size"
                      style={{ ...selectStyle, minWidth: 72 }}
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
                  </SelectWrap>
                </Row>
                <Row label="Font">
                  <SelectWrap>
                    <select
                      className={SELECT}
                      data-testid="sa-axis-font"
                      style={selectStyle}
                      value={prefs.axisFont}
                      onChange={(e) => patch({ axisFont: e.target.value })}
                    >
                      {AXIS_FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </SelectWrap>
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
                    className={INPUT}
                    style={{ ...selectStyle, width: 72 }}
                    value={Math.round((prefs.marginTop ?? 0.05) * 100)}
                    onChange={(e) =>
                      patch({
                        marginTop:
                          Math.min(40, Math.max(0, Number(e.target.value) || 0)) /
                          100,
                      })
                    }
                  />
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    %
                  </span>
                </Row>
                <Row label="Bottom">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    className={INPUT}
                    style={{ ...selectStyle, width: 72 }}
                    value={Math.round((prefs.marginBottom ?? 0.05) * 100)}
                    onChange={(e) =>
                      patch({
                        marginBottom:
                          Math.min(40, Math.max(0, Number(e.target.value) || 0)) /
                          100,
                      })
                    }
                  />
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    %
                  </span>
                </Row>
                <Row label="Right">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    className={INPUT}
                    style={{ ...selectStyle, width: 72 }}
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
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    bars
                  </span>
                </Row>
              </Group>
            ) : null}

            {has("priceFormat") ? (
              <Group label="Candles">
                <Row label="Format">
                  <SelectWrap>
                    <select
                      className={SELECT}
                      style={selectStyle}
                      value={prefs.priceFormat}
                      onChange={(e) =>
                        patch({
                          priceFormat: e.target.value as SaPrefs["priceFormat"],
                        })
                      }
                    >
                      <option value="candle">Candle</option>
                      <option value="bar">Bar</option>
                      <option value="line">Line</option>
                    </select>
                  </SelectWrap>
                </Row>
                <Row
                  label={
                    <CheckLabel
                      checked={prefs.colorByPrevClose}
                      onChange={(v) => patch({ colorByPrevClose: v })}
                    >
                      Color bars based on previous close
                    </CheckLabel>
                  }
                >
                  <span />
                </Row>
                <Row
                  label={
                    <CheckLabel
                      checked={prefs.candleBodyOn}
                      onChange={(v) => patch({ candleBodyOn: v })}
                    >
                      Body
                    </CheckLabel>
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
                    <CheckLabel
                      checked={prefs.candleBorderOn}
                      onChange={(v) => patch({ candleBorderOn: v })}
                    >
                      Borders
                    </CheckLabel>
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
                    <CheckLabel
                      checked={prefs.candleWickOn}
                      onChange={(v) => patch({ candleWickOn: v })}
                    >
                      Wick
                    </CheckLabel>
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
                  <SelectWrap>
                    <select
                      className={SELECT}
                      data-testid="sa-vp-anchor"
                      style={selectStyle}
                      value={prefs.orientation}
                      onChange={(e) =>
                        patch({ orientation: e.target.value as "ltr" | "rtl" })
                      }
                    >
                      <option value="ltr">Left</option>
                      <option value="rtl">Right</option>
                    </select>
                  </SelectWrap>
                </Row>
                <Row label="Width">
                  <input
                    type="number"
                    min={35}
                    max={75}
                    value={Math.round(prefs.profileWidthFrac * 100)}
                    onChange={(e) =>
                      patch({
                        profileWidthFrac: Number(e.target.value) / 100,
                      })
                    }
                    className={INPUT}
                    style={{ ...selectStyle, width: 72 }}
                  />
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    %
                  </span>
                </Row>
                <Row label="Opacity">
                  <input
                    type="number"
                    min={35}
                    max={50}
                    value={Math.round((prefs.profileOpacity || 0.42) * 100)}
                    onChange={(e) =>
                      patch({
                        profileOpacity: Number(e.target.value) / 100,
                      })
                    }
                    className={INPUT}
                    style={{ ...selectStyle, width: 72 }}
                  />
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    %
                  </span>
                </Row>
              </Group>
            ) : null}

            {has("axis") ? (
              <Group label="Price scale">
                <Row label="Scales placement">
                  <SelectWrap>
                    <select
                      className={SELECT}
                      data-testid="sa-scale-side"
                      style={selectStyle}
                      value={prefs.axis}
                      onChange={(e) =>
                        patch({
                          axis: e.target.value as "left" | "right" | "both",
                        })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="both">Both</option>
                    </select>
                  </SelectWrap>
                </Row>
              </Group>
            ) : null}

            {has("lastPriceOn") ? (
              <Group label="Price labels & lines">
                <Row
                  label={
                    <CheckLabel
                      checked={prefs.lastPriceOn}
                      onChange={(v) => patch({ lastPriceOn: v })}
                    >
                      Last price
                    </CheckLabel>
                  }
                >
                  <SwatchLine
                    color={prefs.lastPriceColor}
                    fallback="#26a69a"
                    style="solid"
                    onChange={(v) => patch({ lastPriceColor: v })}
                  />
                </Row>
                <Row
                  label={
                    <CheckLabel
                      testId="sa-hilo-on"
                      checked={prefs.hiLoOn}
                      onChange={(v) => patch({ hiLoOn: v })}
                    >
                      High and low
                    </CheckLabel>
                  }
                >
                  <span className="inline-flex items-center" style={{ gap: 8 }}>
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
                </Row>
              </Group>
            ) : null}

            {has("legendOn") ? (
              <Row
                label={
                  <CheckLabel
                    checked={prefs.legendOn}
                    onChange={(v) => patch({ legendOn: v })}
                  >
                    Show legend
                  </CheckLabel>
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
                    className={INPUT}
                    style={{ ...selectStyle, width: 80 }}
                    value={prefs.priceLookbackDays}
                    onChange={(e) =>
                      patch({
                        priceLookbackDays: Number(e.target.value) || 5,
                      })
                    }
                  />
                </Row>
                <p className="text-[12px]" style={{ color: MUTED }}>
                  Moves the price layer only — profile stays full-history (A12).
                </p>
              </Group>
            ) : null}

            {openPart === "L3" && fields.length <= 1 ? (
              <p className="text-[15px]" style={{ color: MUTED }}>
                Visibility only — no extra settings (A7).
              </p>
            ) : null}
          </div>
        </div>

        <footer
          className="flex shrink-0 items-center justify-between px-4"
          style={{
            height: FOOTER_H,
            borderTop: `1px solid ${HAIRLINE}`,
          }}
        >
          <SelectWrap>
            <select
              className="appearance-none rounded-md border bg-white pl-3 pr-8 text-[14px] text-black"
              style={{ height: CTRL_H, borderColor: BORDER, width: 118 }}
              data-testid="sa-defaults-menu"
              value=""
              aria-label="Template"
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
          </SelectWrap>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="sa-settings-cancel"
              className="rounded-md border bg-white px-4 text-[14px] text-black"
              style={{
                height: CTRL_H,
                borderColor: BORDER,
                minWidth: 84,
              }}
              onClick={cancel}
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="sa-settings-ok"
              className="rounded-md bg-black px-4 text-[14px] font-medium text-white"
              style={{ height: CTRL_H, minWidth: 64 }}
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
