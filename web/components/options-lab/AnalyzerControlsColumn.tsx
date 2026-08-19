"use client";

/**
 * Analyzer left inspector — Human Interface Spec v1.0.
 * Chrome only. Parent owns OPF / book / Create dialog wiring.
 */

import Link from "next/link";
import Button from "@/components/ui/Button";
import { IconChevronRight, IconPlus } from "@/components/ui/icons";
import {
  INSPECTOR_W,
  InspectorSection,
  inspectorAside,
  inspectorBody,
  inspectorField,
  inspectorFooter,
  inspectorListRow,
  inspectorRow,
  inspectorRowLabel,
  inspectorStickyNav,
} from "@/components/options-lab/inspectorChrome";
import {
  OPF_ANALYZER_MODELS,
  type OpfModelOption,
  type OpfUseCase,
} from "@/lib/options-lab/opfModels";
import type { SessionPosture } from "@/lib/options-lab/sessionPosture";

export const ANALYZER_INSPECTOR_W = INSPECTOR_W;

const USE_CASE_LABEL: Record<OpfUseCase, string> = {
  day_trade: "Day trade",
  outlook: "Outlook",
  backtest: "Backtest",
};

function postureLabel(posture: SessionPosture): string {
  if (posture === "Live") return "Live";
  if (posture === "Extended") return "Pre/post";
  return "Off market";
}

function formatSigned(n: number, suffix: string, digits = 0): string {
  const v = digits > 0 ? n.toFixed(digits) : n.toFixed(0);
  return `${n >= 0 ? "+" : ""}${v}${suffix}`;
}

export type AnalyzerControlsColumnProps = {
  posture: SessionPosture;
  model: OpfModelOption;
  inputOverrideActive: boolean;
  sessionHeld: boolean;
  symbol: string;
  universe: { symbol: string }[];
  universeLoading: boolean;
  onSymbolChange: (symbol: string) => void;
  onModelChange: (packId: string) => void;
  spotStr: string;
  vixStr: string;
  onSpotChange: (value: string) => void;
  onVixChange: (value: string) => void;
  timeMachineEnabled: boolean;
  onTimeMachineEnabled: (value: boolean) => void;
  elapsedHours: number;
  onElapsedHours: (value: number) => void;
  remainingHours: number;
  timeStepHours: number;
  timeReadout: string;
  timeDisabled: boolean;
  simIvPct: number;
  onSimIvPct: (value: number) => void;
  volMin: number;
  volMax: number;
  volReadout: string;
  volDisabled: boolean;
  simSpotPct: number;
  onSimSpotPct: (value: number) => void;
  onResetSim: () => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshDisabled: boolean;
  refreshLoading: boolean;
  onAutoFit: () => void;
  autoFitDisabled: boolean;
  showReanchor: boolean;
  epochStale: boolean;
  onReanchor: () => void;
  viewportFocusLabel: string | null;
  markPkg: string | null;
  reconLabel: "override" | "n/a held" | "pass" | "fail" | "—";
  packLine: string | null;
  bookNotice: string | null;
  riskError: string | null;
};

export default function AnalyzerControlsColumn({
  posture,
  model,
  inputOverrideActive,
  sessionHeld,
  symbol,
  universe,
  universeLoading,
  onSymbolChange,
  onModelChange,
  spotStr,
  vixStr,
  onSpotChange,
  onVixChange,
  timeMachineEnabled,
  onTimeMachineEnabled,
  elapsedHours,
  onElapsedHours,
  remainingHours,
  timeStepHours,
  timeReadout,
  timeDisabled,
  simIvPct,
  onSimIvPct,
  volMin,
  volMax,
  volReadout,
  volDisabled,
  simSpotPct,
  onSimSpotPct,
  onResetSim,
  onCreate,
  onRefresh,
  refreshDisabled,
  refreshLoading,
  onAutoFit,
  autoFitDisabled,
  showReanchor,
  epochStale,
  onReanchor,
  viewportFocusLabel,
  markPkg,
  reconLabel,
  packLine,
  bookNotice,
  riskError,
}: AnalyzerControlsColumnProps) {
  const simAtRest =
    elapsedHours === 0 &&
    simSpotPct === 0 &&
    !timeMachineEnabled;
  const showReadout =
    viewportFocusLabel != null ||
    markPkg != null ||
    bookNotice != null ||
    riskError != null;

  return (
    <aside
      className={inspectorAside}
      data-testid="analyzer-controls-column"
    >
      <div className={inspectorStickyNav}>
        <div className="flex min-h-[var(--hit-min)] flex-wrap items-center justify-between gap-2">
          <h2 className="text-[length:var(--text-title-3)] font-semibold tracking-tight text-[var(--color-label)]">
            Analyzer
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full px-2 py-1 " +
                "text-[length:var(--text-caption)] font-medium " +
                (posture === "Live"
                  ? "bg-[color-mix(in_srgb,var(--color-success)_18%,transparent)] text-[var(--color-success)]"
                  : posture === "Extended"
                    ? "bg-[var(--color-tint-soft)] text-[var(--color-tint)]"
                    : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]")
              }
              data-testid="analyzer-posture-badge"
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (posture === "Live"
                    ? "bg-[var(--color-success)]"
                    : posture === "Extended"
                      ? "bg-[var(--color-tint)]"
                      : "bg-[var(--color-label-tertiary)]")
                }
                aria-hidden
              />
              {postureLabel(posture)}
            </span>
            <span className="rounded-full bg-[var(--color-fill)] px-2 py-1 text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
              {USE_CASE_LABEL[model.useCase]}
            </span>
          </div>
        </div>
        <div data-testid="analyzer-open-builder" className="contents">
          <Button
            variant="primary"
            className="mt-1 w-full"
            aria-label="Create position"
            data-testid="analyzer-controls-create-position"
            onClick={onCreate}
          >
            <IconPlus size={18} />
            Create position
          </Button>
        </div>
      </div>

      <div className={inspectorBody}>

        {(inputOverrideActive || sessionHeld) && (
          <div
            className={
              "rounded-[var(--radius-md)] px-3 py-2.5 text-[length:var(--text-footnote)] leading-snug " +
              (inputOverrideActive
                ? "bg-[var(--color-tint-soft)] text-[var(--color-tint)]"
                : posture === "Extended"
                  ? "bg-[var(--color-fill)] text-[var(--color-label)]"
                  : "bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-label)]")
            }
            data-testid="analyzer-override-banner"
            role="status"
          >
            {inputOverrideActive
              ? "Override active — RECON is override (not live pass/fail)."
              : posture === "Extended"
                ? "Pre/post session — Massive last print / extended quotes. Not RTH NBBO."
                : "Off market — last print. Not polling a live chain."}
          </div>
        )}

        <InspectorSection title="Instrument">
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Symbol</span>
            <select
              className={inspectorField}
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
              disabled={universeLoading}
              data-testid="analyzer-symbol-select"
            >
              {universe.map((u) => (
                <option key={u.symbol} value={u.symbol}>
                  {u.symbol}
                </option>
              ))}
            </select>
          </label>
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>OPF model</span>
            <select
              className={inspectorField}
              value={model.packId}
              onChange={(e) => onModelChange(e.target.value)}
              data-testid="opf-model-select"
            >
              {OPF_ANALYZER_MODELS.map((m) => (
                <option key={m.packId} value={m.packId}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <p className={inspectorFooter}>{model.description}</p>
        </InspectorSection>

        <InspectorSection title="Marks">
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Spot</span>
            <input
              className={inspectorField + " font-mono tabular-nums"}
              value={spotStr}
              onChange={(e) => onSpotChange(e.target.value)}
              data-testid="analyzer-spot-input"
            />
          </label>
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>VIX</span>
            <input
              className={inspectorField + " font-mono tabular-nums"}
              value={vixStr}
              onChange={(e) => onVixChange(e.target.value)}
              data-testid="analyzer-vix-input"
            />
          </label>
        </InspectorSection>

        <InspectorSection title="What-if" testId="analyzer-whatif-panel">
          <div className={inspectorRow + " justify-between"}>
            <span className="text-[length:var(--text-subheadline)] text-[var(--color-label)]">
              What-if
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={timeMachineEnabled}
              aria-label="What-if"
              data-testid="analyzer-whatif-enable"
              onClick={() => onTimeMachineEnabled(!timeMachineEnabled)}
              className={
                "relative h-7 w-11 shrink-0 rounded-full p-0.5 transition-colors " +
                (timeMachineEnabled
                  ? "bg-[var(--color-tint)]"
                  : "bg-[var(--color-fill)]")
              }
            >
              <span
                className={
                  "block h-6 w-6 rounded-full bg-[var(--color-surface)] shadow-sm transition-transform " +
                  (timeMachineEnabled ? "translate-x-4" : "translate-x-0")
                }
              />
            </button>
          </div>
          <SliderRow
            label="Time"
            value={timeReadout}
            min={0}
            max={Math.max(0, remainingHours)}
            step={timeStepHours}
            disabled={timeDisabled}
            testId="analyzer-whatif-time"
            valueNow={elapsedHours}
            onChange={onElapsedHours}
            ends={["Now", "Last trade"]}
          />
          <SliderRow
            label="Implied vol"
            value={volReadout}
            min={volMin}
            max={volMax}
            step={0.1}
            disabled={volDisabled}
            testId="analyzer-whatif-vol"
            valueNow={simIvPct}
            onChange={onSimIvPct}
          />
          <SliderRow
            label="Spot %"
            value={formatSigned(simSpotPct, "%", 1)}
            min={-5}
            max={5}
            step={0.1}
            disabled={!timeMachineEnabled}
            testId="analyzer-whatif-spotpct"
            valueNow={simSpotPct}
            onChange={onSimSpotPct}
          />
          <div className="flex justify-end px-2 py-1">
            <Button
              variant="plain"
              className="!min-h-11 !px-3"
              disabled={simAtRest && !timeMachineEnabled}
              onClick={onResetSim}
            >
              Reset
            </Button>
          </div>
        </InspectorSection>

        <InspectorSection title="Graph">
          <button
            type="button"
            className={inspectorListRow}
            onClick={onRefresh}
            disabled={refreshDisabled}
          >
            <span>Refresh</span>
            {refreshLoading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-separator)] border-t-[var(--color-tint)]"
                aria-hidden
              />
            ) : null}
          </button>
          <button
            type="button"
            className={inspectorListRow}
            onClick={onAutoFit}
            disabled={autoFitDisabled}
          >
            Auto-fit
          </button>
          {showReanchor ? (
            <button type="button" className={inspectorListRow} onClick={onReanchor}>
              <span>Re-anchor</span>
              {epochStale ? (
                <span className="text-[length:var(--text-caption)] text-[var(--color-warning)]">
                  Stale
                </span>
              ) : null}
            </button>
          ) : null}
        </InspectorSection>

        <InspectorSection title="Go to">
          <Link
            href="/app/options-lab/heatmap"
            className={inspectorListRow + " no-underline"}
          >
            <span>Heatmap</span>
            <IconChevronRight
              size={20}
              className="text-[var(--color-tint)]"
            />
          </Link>
        </InspectorSection>

        {showReadout ? (
          <InspectorSection title="Readout">
            {viewportFocusLabel ? (
              <p
                className="min-h-[var(--hit-min)] px-3 py-2.5 text-[length:var(--text-footnote)] text-[var(--color-tint)]"
                data-testid="analyzer-viewport-focus"
              >
                {viewportFocusLabel}
              </p>
            ) : null}
            {markPkg != null ? (
              <div className="grid grid-cols-2 divide-x divide-[var(--color-separator)]">
                <div className="flex min-h-[var(--hit-min)] flex-col justify-center px-3 py-2">
                  <div className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                    Mark pkg
                  </div>
                  <div className="font-mono text-[length:var(--text-subheadline)] text-[var(--color-label)]">
                    {markPkg}
                  </div>
                </div>
                <div className="flex min-h-[var(--hit-min)] flex-col justify-center px-3 py-2">
                  <div className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                    RECON
                  </div>
                  <div
                    className={
                      "font-mono text-[length:var(--text-subheadline)] font-semibold " +
                      (reconLabel === "override"
                        ? "text-[var(--color-tint)]"
                        : reconLabel === "n/a held"
                          ? "text-[var(--color-label-tertiary)]"
                          : reconLabel === "pass"
                            ? "text-[var(--color-success)]"
                            : reconLabel === "fail"
                              ? "text-[var(--color-destructive)]"
                              : "text-[var(--color-label)]")
                    }
                    data-testid="analyzer-recon-chip"
                  >
                    {reconLabel}
                  </div>
                </div>
              </div>
            ) : null}
            {packLine ? (
              <p className="px-3 py-2 text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                {packLine}
              </p>
            ) : null}
            {bookNotice ? (
              <p
                className="px-3 py-2 text-[length:var(--text-footnote)] text-[var(--color-success)]"
                role="status"
              >
                {bookNotice}
              </p>
            ) : null}
            {riskError ? (
              <p
                className="px-3 py-2 text-[length:var(--text-footnote)] text-[var(--color-warning)]"
                role="status"
              >
                {riskError}
              </p>
            ) : null}
          </InspectorSection>
        ) : null}
      </div>
    </aside>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  disabled,
  testId,
  valueNow,
  onChange,
  ends,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  testId: string;
  valueNow: number;
  onChange: (n: number) => void;
  ends?: [string, string];
}) {
  const hi = max > min ? max : min + step;
  const thumb = Math.min(Math.max(valueNow, min), max > min ? max : min);
  return (
    <div className="flex min-h-[var(--hit-min)] flex-col justify-center gap-1 border-b border-[var(--color-separator)] px-3 py-2 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[length:var(--text-subheadline)] text-[var(--color-label)]">
          {label}
        </span>
        <span className="max-w-[15rem] text-right font-mono tabular-nums text-[length:var(--text-caption)] leading-snug text-[var(--color-label)]">
          {value}
        </span>
      </div>
      <input
        type="range"
        className="w-full accent-[var(--color-tint)] disabled:opacity-45"
        min={min}
        max={hi}
        step={step}
        value={thumb}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={testId}
      />
      {ends ? (
        <div className="flex justify-between text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
