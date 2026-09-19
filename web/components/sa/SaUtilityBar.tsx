"use client";

import type { ReactNode } from "react";
import { SA_DEV_TERRITORY, type TerritoryEntry } from "@/lib/saDevTerritory";
import { spanChipText, type PriceTf } from "@/lib/saLayerStore";
import { continuousChip, mappingBadge, type ContinuousBlock } from "@/lib/saScale";
import { SA_INTERVALS, SA_THEME } from "@/lib/saTheme";
import type { SaStructure } from "@/lib/saSurface";
import SaLayerStrip from "./SaLayerStrip";
import { useSaCanvas } from "./SaCanvasContext";

export default function SaUtilityBar({
  title,
  pendingName,
  shownLabel,
  data,
  sources,
  sourceId,
  onSource,
  extra,
  focus,
  onFocus,
  overlayOn,
  onOverlay,
  axis,
  onAxis,
  orientation,
  onOrientation,
  spanFloor,
  spanCeiling,
  spanTruncated,
  continuous,
}: {
  title: string;
  pendingName?: boolean;
  shownLabel: string | null;
  data: SaStructure | null;
  sources: { id: string; label: string }[];
  sourceId: string;
  onSource: (id: string) => void;
  extra?: ReactNode;
  focus: TerritoryEntry;
  onFocus: (e: TerritoryEntry) => void;
  overlayOn?: boolean;
  onOverlay?: (on: boolean) => void;
  axis?: "left" | "right" | "both";
  onAxis?: (a: "left" | "right" | "both") => void;
  orientation?: "ltr" | "rtl";
  onOrientation?: (o: "ltr" | "rtl") => void;
  spanFloor?: string | null;
  spanCeiling?: string | null;
  spanTruncated?: boolean;
  continuous?: ContinuousBlock;
}) {
  const { open, prefs, patch, resetMode, resetView, liveFlag } = useSaCanvas();
  const status = data?.named_state || data?.status || "—";
  const mapping = mappingBadge(data?.flags?.mapping);
  const contText = continuousChip(continuous);
  const cov = data?.coverage;
  const floor = spanFloor ?? cov?.floor_session;
  const ceiling = spanCeiling ?? cov?.ceiling_session;
  const coverageText = floor || ceiling ? `${floor ?? "—"}…${ceiling ?? "—"}` : "—";
  const spanText = spanChipText({
    floor,
    ceiling,
    truncated: spanTruncated ?? cov?.truncated,
    spanPreset: prefs.spanPreset,
  });

  return (
    <div
      className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-800 bg-[#131722] px-2"
      data-testid="sa-utility-bar"
      style={{
        minHeight: 60,
        maxHeight: 68,
        fontFamily: SA_THEME.uiFont,
        letterSpacing: SA_THEME.letterSpacing,
        fontSize: SA_THEME.chipSize,
      }}
    >
      <span
        className="shrink-0 text-sm font-semibold text-zinc-100"
        data-testid={pendingName ? "volume-profile-pending-name" : "sa-bar-title"}
      >
        {title}
        {pendingName ? (
          <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-[var(--color-label-tertiary)]">
            PENDING-NAME
          </span>
        ) : null}
      </span>
      <select
        className="h-8 shrink-0 rounded border border-zinc-700 bg-[#1e222d] px-1.5 text-xs text-zinc-200"
        value={sourceId}
        onChange={(e) => onSource(e.target.value)}
        aria-label="Source"
        data-testid="sa-source-select"
      >
        {sources.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        className="h-8 shrink-0 rounded border border-zinc-700 bg-[#1e222d] px-1.5 text-xs text-zinc-200"
        value={prefs.priceTf}
        onChange={(e) => patch({ priceTf: e.target.value as PriceTf })}
        aria-label="Interval"
        data-testid="sa-interval"
      >
        {SA_INTERVALS.map((tf) => (
          <option key={tf} value={tf}>
            {tf === "1d" ? "1D" : tf}
          </option>
        ))}
      </select>
      <Chip
        testId="sa-live-flag"
        title="Last-print age from v1.3 heartbeat"
        text={liveFlag}
        className={
          liveFlag === "LIVE"
            ? "border-emerald-700 text-emerald-400"
            : liveFlag === "STALE"
              ? "border-amber-700 text-amber-400"
              : "text-zinc-500"
        }
      />
      <Chip
        testId="sa-dev-shown-label"
        title="Session bind from payload"
        text={shownLabel || "—"}
        onClick={() => open("chips")}
      />
      <Chip
        testId="sa-status-chip"
        title="Upstream status"
        text={String(status)}
        onClick={() => open("chips")}
      />
      <Chip
        testId="sa-span-chip"
        title="Full-history profile — click for price-layer x-range"
        text={spanText}
        onClick={() => open("range")}
      />
      <Chip
        testId="sa-coverage-chip"
        title="Coverage floor…ceiling"
        text={coverageText}
        onClick={() => open("chips")}
      />
      <Chip
        testId="sa-mapping-chip"
        title="Canvas price space"
        text={mapping}
        onClick={() => open("chips")}
      />
      {contText ? (
        <Chip
          testId="sa-continuous-chip"
          title="Futures continuous series (D6.5)"
          text={contText}
          onClick={() => open("chips")}
        />
      ) : null}
      <SaLayerStrip />
      <button
        type="button"
        data-testid="sa-mode-chip"
        title="Workflow mode"
        onClick={() => open("mode")}
        onContextMenu={(e) => {
          e.preventDefault();
          open("mode");
        }}
        className="h-8 shrink-0 rounded-full border border-zinc-700 px-2 text-[11px] uppercase text-zinc-300"
      >
        {prefs.mode === "morning"
          ? "Morning"
          : prefs.mode === "entry"
            ? "Entry"
            : "Manage"}
      </button>
      <button
        type="button"
        data-testid="sa-mode-reset"
        title="Reset this mode to house default"
        onClick={() => {
          resetMode();
          resetView();
        }}
        className="h-8 shrink-0 text-[11px] text-[var(--color-label-tertiary)] underline"
      >
        Reset
      </button>
      {extra}
      <nav
        className="ml-auto flex shrink-0 items-center gap-0.5"
        data-testid="sa-dev-territory"
        aria-label="SA territory"
      >
        {SA_DEV_TERRITORY.map((entry) => {
          const active = focus.id === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              title={entry.doctrine}
              data-testid={`sa-dev-nav-${entry.id}`}
              onClick={() => onFocus(entry)}
              className={`h-8 max-w-[7.5rem] truncate rounded px-2 text-[11px] ${
                active
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {entry.label}
              {entry.status === "in-development" ? (
                <span className="ml-0.5 text-[9px] uppercase text-[var(--color-label-tertiary)]">
                  ·dev
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Chip({
  text,
  title,
  testId,
  onClick,
  className = "",
}: {
  text: string;
  title: string;
  testId: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      title={title}
      onClick={onClick}
      onContextMenu={(e) => {
        if (!onClick) return;
        e.preventDefault();
        onClick();
      }}
      className={`h-8 max-w-[14rem] shrink-0 truncate rounded-full border border-zinc-700 bg-[#1e222d] px-2 text-[11px] leading-8 text-zinc-300 ${className}`}
    >
      {text}
    </button>
  );
}
