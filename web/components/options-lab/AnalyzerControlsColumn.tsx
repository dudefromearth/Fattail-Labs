"use client";

/**
 * Analyzer left inspector — Human Interface Spec v1.0.
 * Chrome only. Parent owns OPF / book / Create dialog wiring.
 */

import Button from "@/components/ui/Button";
import { IconPlus } from "@/components/ui/icons";
import {
  INSPECTOR_W,
  InspectorSection,
  inspectorAside,
  inspectorBody,
  inspectorField,
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
import { gexTemplate } from "@/lib/options-lab/templates/gex";
import type { ValueModeId } from "@/lib/options-lab/templates/types";

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
  gexEnabled: boolean;
  onGexEnabled: (value: boolean) => void;
  gexValueMode: ValueModeId;
  onGexValueMode: (value: ValueModeId) => void;
  gexOpacityPct: number;
  onGexOpacityPct: (value: number) => void;
  rangeEnabled: boolean;
  onRangeEnabled: (value: boolean) => void;
  rangeHorizon: string;
  onRangeHorizon: (value: string) => void;
  rangeExpirations: string[];
  rangePct1: number;
  onRangePct1: (value: number) => void;
  rangeSecondOn: boolean;
  onRangeSecondOn: (value: boolean) => void;
  rangePct2: number;
  onRangePct2: (value: number) => void;
  rangePctDisabled: boolean;
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
  gexEnabled,
  onGexEnabled,
  gexValueMode,
  onGexValueMode,
  gexOpacityPct,
  onGexOpacityPct,
  rangeEnabled,
  onRangeEnabled,
  rangeHorizon,
  onRangeHorizon,
  rangeExpirations,
  rangePct1,
  onRangePct1,
  rangeSecondOn,
  onRangeSecondOn,
  rangePct2,
  onRangePct2,
  rangePctDisabled,
}: AnalyzerControlsColumnProps) {
  const simAtRest =
    elapsedHours === 0 &&
    simSpotPct === 0 &&
    !timeMachineEnabled;

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
        </InspectorSection>

        <InspectorSection title="GEX" testId="analyzer-gex-panel">
          <div className={inspectorRow + " justify-between"}>
            <span className="text-[length:var(--text-subheadline)] text-[var(--color-label)]">
              GEX
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={gexEnabled}
              aria-label="GEX backdrop"
              data-testid="analyzer-gex-enable"
              onClick={() => onGexEnabled(!gexEnabled)}
              className={
                "relative h-7 w-11 shrink-0 rounded-full p-0.5 transition-colors " +
                (gexEnabled
                  ? "bg-[var(--color-tint)]"
                  : "bg-[var(--color-fill)]")
              }
            >
              <span
                className={
                  "block h-6 w-6 rounded-full bg-[var(--color-surface)] shadow-sm transition-transform " +
                  (gexEnabled ? "translate-x-4" : "translate-x-0")
                }
              />
            </button>
          </div>
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Value</span>
            <select
              className={inspectorField}
              value={gexValueMode}
              disabled={!gexEnabled}
              onChange={(e) =>
                onGexValueMode(e.target.value as ValueModeId)
              }
              data-testid="analyzer-gex-value-mode"
            >
              {gexTemplate.valueModes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <SliderRow
            label="Opacity"
            value={`${Math.round(gexOpacityPct)}%`}
            min={0}
            max={100}
            step={1}
            disabled={!gexEnabled}
            testId="analyzer-gex-opacity"
            valueNow={gexOpacityPct}
            onChange={onGexOpacityPct}
          />
        </InspectorSection>

        <InspectorSection title="Range" testId="analyzer-range-panel">
          <div className={inspectorRow + " justify-between"}>
            <span className="text-[length:var(--text-subheadline)] text-[var(--color-label)]">
              Show
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={rangeEnabled}
              aria-label="Show range"
              data-testid="analyzer-range-enable"
              onClick={() => onRangeEnabled(!rangeEnabled)}
              className={
                "relative h-7 w-11 shrink-0 rounded-full p-0.5 transition-colors " +
                (rangeEnabled
                  ? "bg-[var(--color-tint)]"
                  : "bg-[var(--color-fill)]")
              }
            >
              <span
                className={
                  "block h-6 w-6 rounded-full bg-[var(--color-surface)] shadow-sm transition-transform " +
                  (rangeEnabled ? "translate-x-4" : "translate-x-0")
                }
              />
            </button>
          </div>
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Expiration</span>
            <select
              className={inspectorField}
              value={rangeHorizon}
              disabled={!rangeEnabled || rangeExpirations.length === 0}
              onChange={(e) => onRangeHorizon(e.target.value)}
              data-testid="analyzer-range-horizon"
            >
              {rangeExpirations.length === 0 ? (
                <option value="">—</option>
              ) : null}
              {rangeExpirations.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Width</span>
            <span className="flex min-w-0 flex-1 items-center gap-1">
              <input
                className={inspectorField + " font-mono tabular-nums"}
                type="number"
                min={0.01}
                max={99.99}
                step={0.01}
                value={
                  Number.isFinite(rangePct1) ? rangePct1.toFixed(2) : ""
                }
                disabled={!rangeEnabled || rangePctDisabled}
                onChange={(e) => onRangePct1(Number(e.target.value))}
                data-testid="analyzer-range-pct1"
                aria-label="Range coverage percent"
              />
              <span className="shrink-0 text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
                %
              </span>
            </span>
          </label>
          <div className={inspectorRow + " justify-between"}>
            <span className="text-[length:var(--text-subheadline)] text-[var(--color-label)]">
              Second
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={rangeSecondOn}
              aria-label="Second range"
              data-testid="analyzer-range-second"
              disabled={!rangeEnabled}
              onClick={() => onRangeSecondOn(!rangeSecondOn)}
              className={
                "relative h-7 w-11 shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-45 " +
                (rangeSecondOn && rangeEnabled
                  ? "bg-[var(--color-tint)]"
                  : "bg-[var(--color-fill)]")
              }
            >
              <span
                className={
                  "block h-6 w-6 rounded-full bg-[var(--color-surface)] shadow-sm transition-transform " +
                  (rangeSecondOn && rangeEnabled
                    ? "translate-x-4"
                    : "translate-x-0")
                }
              />
            </button>
          </div>
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Second</span>
            <span className="flex min-w-0 flex-1 items-center gap-1">
              <input
                className={inspectorField + " font-mono tabular-nums"}
                type="number"
                min={0.01}
                max={99.99}
                step={0.01}
                value={
                  Number.isFinite(rangePct2) ? rangePct2.toFixed(2) : ""
                }
                disabled={!rangeEnabled || !rangeSecondOn || rangePctDisabled}
                onChange={(e) => onRangePct2(Number(e.target.value))}
                data-testid="analyzer-range-pct2"
                aria-label="Second range coverage percent"
              />
              <span className="shrink-0 text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
                %
              </span>
            </span>
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
