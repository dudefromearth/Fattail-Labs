"use client";

/**
 * Analyzer left inspector — Human Interface Spec v1.0.
 * Chrome only. Parent owns OPF / book / Create dialog wiring.
 */

import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import {
  INSPECTOR_W,
  InspectorSection,
  inspectorAside,
  inspectorBody,
  inspectorField,
  inspectorRow,
  inspectorRowLabel,
  inspectorStickyNav,
} from "@/components/options-lab/inspectorChrome";
import type { SessionPosture } from "@/lib/options-lab/sessionPosture";
import { gexTemplate } from "@/lib/options-lab/templates/gex";
import type { ValueModeId } from "@/lib/options-lab/templates/types";
import {
  appendStatusLog,
  formatStatusLogLine,
  planeExceptionMessage,
  type StatusLogEntry,
} from "@/lib/options-lab/statusLog";
import { useEffect, useState } from "react";
import ProbSigmaField from "@/components/options-lab/ProbSigmaField";
import {
  RANGE_INNER_SIGMA_PRESETS,
  RANGE_OUTER_SIGMA_PRESETS,
} from "@/lib/options-lab/probRange";

export const ANALYZER_INSPECTOR_W = INSPECTOR_W;

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
  inputOverrideActive: boolean;
  sessionHeld: boolean;
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
  simSpotPts: number;
  onSimSpotPts: (value: number) => void;
  spotPtsMin: number;
  spotPtsMax: number;
  onResetSim: () => void;
  onCreate: () => void;
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
  rangeOpacityPct: number;
  onRangeOpacityPct: (value: number) => void;
  alerts: {
    id: string;
    kind: "canvas" | "position";
    title: string;
    runState: "idle" | "live" | "touched";
    unbound?: boolean;
    /** When Touched: time + print, e.g. "10:42 AM ET at 6724". */
    touchedDetail?: string;
    algoPhase?: "waiting" | "armed" | "recorded";
    demo?: boolean;
  }[];
  onCreateAlert: () => void;
  /** Eligible OTM debit fly on the book — subtle pulse on +. */
  algoPulse?: boolean;
  /** One-shot book / lock notices — logged in the exception field. */
  notice?: string | null;
  onEditAlert: (id: string) => void;
  onToggleAlertState?: (id: string) => void;
  onDeleteAlert?: (id: string) => void;
  /** Clears Demo on holder alerts so the Demo Mode wrap dismisses. */
  onExitDemo?: () => void;
};

export default function AnalyzerControlsColumn({
  posture,
  inputOverrideActive,
  sessionHeld,
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
  simSpotPts,
  onSimSpotPts,
  spotPtsMin,
  spotPtsMax,
  onResetSim,
  onCreate,
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
  rangeOpacityPct,
  onRangeOpacityPct,
  alerts,
  onCreateAlert,
  algoPulse = false,
  notice = null,
  onEditAlert,
  onToggleAlertState,
  onDeleteAlert,
  onExitDemo,
}: AnalyzerControlsColumnProps) {
  const [statusLog, setStatusLog] = useState<StatusLogEntry[]>([]);
  const planeMsg = planeExceptionMessage({
    inputOverrideActive,
    sessionHeld,
    posture,
  });

  useEffect(() => {
    setStatusLog((prev) => appendStatusLog(prev, planeMsg, Date.now()));
  }, [planeMsg]);

  useEffect(() => {
    setStatusLog((prev) => appendStatusLog(prev, notice, Date.now()));
  }, [notice]);

  const simAtRest =
    elapsedHours === 0 &&
    simSpotPts === 0 &&
    !timeMachineEnabled;
  const demoLinked = alerts.some((a) => a.demo === true);

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

        <div
          className={
            "h-[4.125em] overflow-y-auto rounded-[var(--radius-md)] px-3 py-1 " +
            "text-[length:var(--text-footnote)] leading-snug " +
            "bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] " +
            "text-[var(--color-label)]"
          }
          data-testid="analyzer-override-banner"
          role="status"
          aria-live="polite"
        >
          {statusLog.length === 0 ? (
            <span className="text-[var(--color-label-tertiary)]"> </span>
          ) : (
            statusLog.map((entry) => (
              <div key={`${entry.at}-${entry.text}`}>
                {formatStatusLogLine(entry)}
              </div>
            ))
          )}
        </div>

        <div
          className={
            demoLinked
              ? "flex flex-col gap-5 rounded-[var(--radius-md)] border border-red-500/55 bg-red-500/15 p-3 shadow-[inset_0_0_22px_8px_rgba(239,68,68,0.28)]"
              : "flex flex-col gap-5"
          }
          data-testid="analyzer-demo-link"
          data-demo-link={demoLinked ? "1" : "0"}
        >
        {demoLinked ? (
          <div className="flex min-h-[var(--hit-min)] items-center justify-between gap-2 px-1">
            <h4 className="text-[length:var(--text-subheadline)] font-semibold text-[var(--color-label)]">
              Demo Mode
            </h4>
            <Button
              variant="plain"
              className="!min-h-11 !px-3"
              onClick={onExitDemo}
              data-testid="analyzer-demo-exit"
            >
              Exit
            </Button>
          </div>
        ) : null}
        <InspectorSection
          title="Alerts"
          testId="analyzer-alerts-panel"
          headerInPanel
          headerRight={
            <IconButton
              label="Create alert"
              onClick={onCreateAlert}
              data-testid="analyzer-alert-create"
              data-algo-pulse={algoPulse ? "1" : "0"}
              className={
                "shrink-0 rounded-full bg-[var(--color-tint)] text-white hover:bg-[var(--color-tint-emphasis)] hover:text-white" +
                (algoPulse ? " motion-safe:animate-pulse" : "")
              }
            >
              <IconPlus size={18} className="text-white" />
            </IconButton>
          }
        >
          <div
            className="h-[13rem] overflow-y-auto"
            data-testid="analyzer-alerts-holder"
          >
            {alerts.map((a) => {
              const state = a.unbound
                ? "Unbound"
                : a.runState === "live"
                  ? "Live"
                  : a.runState === "touched"
                    ? "Touched"
                    : "Idle";
              const chipCls =
                "shrink-0 min-h-[var(--hit-min)] rounded-full px-3 text-[length:var(--text-caption)] font-medium " +
                (a.unbound
                  ? "bg-[var(--color-fill)] text-[var(--color-label-secondary)]"
                  : a.runState === "live"
                    ? "bg-[var(--color-tint-soft)] text-[var(--color-tint)]"
                    : a.runState === "touched"
                      ? "bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]"
                      : "bg-[var(--color-fill)] text-[var(--color-label-tertiary)]");
              return (
                <div
                  key={a.id}
                  className={inspectorRow + " cursor-pointer"}
                  data-testid={`analyzer-alert-row-${a.id}`}
                  data-alert-kind={a.kind}
                  data-alert-state={a.unbound ? "unbound" : a.runState}
                  data-alert-unbound={a.unbound ? "1" : "0"}
                  data-alert-touched={
                    a.runState === "touched" ? a.touchedDetail || "" : undefined
                  }
                  onClick={() => onEditAlert(a.id)}
                >
                  <button
                    type="button"
                    className="min-h-[var(--hit-min)] min-w-0 flex-1 py-1 text-left"
                    data-testid={`analyzer-alert-edit-${a.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAlert(a.id);
                    }}
                  >
                    <div className="truncate text-[length:var(--text-subheadline)] text-[var(--color-label)]">
                      {a.title}
                    </div>
                    <div className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                      {a.algoPhase === "waiting"
                        ? "Waiting"
                        : a.algoPhase === "armed"
                          ? "Armed"
                          : a.algoPhase === "recorded"
                            ? "Recorded"
                            : a.kind === "position"
                              ? "Position"
                              : "Canvas"}
                      {a.runState === "touched" && a.touchedDetail
                        ? ` · ${a.touchedDetail}`
                        : ""}
                    </div>
                  </button>
                  {a.unbound ? (
                    <span className={chipCls} aria-label="Unbound">
                      Unbound
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={chipCls}
                      data-testid={`analyzer-alert-state-${a.id}`}
                      aria-label={
                        a.runState === "touched"
                          ? `Touched${a.touchedDetail ? ` ${a.touchedDetail}` : ""}. Click to reset to Live`
                          : `${state}. Click to ${a.runState === "live" ? "Idle" : "Live"}`
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleAlertState?.(a.id);
                      }}
                    >
                      {state}
                    </button>
                  )}
                  <IconButton
                    label={`Delete ${a.title}`}
                    tone="destructive"
                    data-testid={`analyzer-alert-delete-${a.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAlert?.(a.id);
                    }}
                  >
                    <IconTrash size={24} />
                  </IconButton>
                </div>
              );
            })}
          </div>
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
            label="Spot"
            value={formatSigned(simSpotPts, "", 0)}
            min={spotPtsMin}
            max={spotPtsMax}
            step={1}
            disabled={!timeMachineEnabled}
            testId="analyzer-whatif-spot"
            valueNow={simSpotPts}
            onChange={onSimSpotPts}
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
        </div>

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

        <InspectorSection title="Probability" testId="analyzer-range-panel">
          <div className={inspectorRow + " justify-between"}>
            <span className="text-[length:var(--text-subheadline)] text-[var(--color-label)]">
              Show
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={rangeEnabled}
              aria-label="Show probability"
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
          <ProbSigmaField
            label="Width"
            pct={rangePct1}
            onChange={onRangePct1}
            presets={RANGE_INNER_SIGMA_PRESETS}
            disabled={!rangeEnabled || rangePctDisabled}
            testId="analyzer-range-pct1"
            ariaLabel="Probability coverage percent"
          />
          <div className={inspectorRow + " justify-between"}>
            <span className="text-[length:var(--text-subheadline)] text-[var(--color-label)]">
              Second
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={rangeSecondOn}
              aria-label="Second probability band"
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
          <ProbSigmaField
            label="Second"
            pct={rangePct2}
            onChange={onRangePct2}
            presets={RANGE_OUTER_SIGMA_PRESETS}
            disabled={!rangeEnabled || !rangeSecondOn || rangePctDisabled}
            testId="analyzer-range-pct2"
            ariaLabel="Second probability coverage percent"
          />
          <SliderRow
            label="Opacity"
            value={`${Math.round(rangeOpacityPct)}%`}
            min={0}
            max={100}
            step={1}
            disabled={!rangeEnabled}
            testId="analyzer-range-opacity"
            valueNow={rangeOpacityPct}
            onChange={onRangeOpacityPct}
          />
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
