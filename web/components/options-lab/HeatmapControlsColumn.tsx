"use client";

/**
 * Heatmap left inspector — same HIG treatment as Analyzer.
 * Chrome only. Parent owns chain bus, templates, ToS generation.
 */

import Link from "next/link";
import { IconChevronRight } from "@/components/ui/icons";
import {
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
  BW_STRIKE_COUNT_CHOICES,
} from "@/lib/options-lab/templates/bwFly";
import { HEATMAP_TEMPLATES } from "@/lib/options-lab/templates/registry";
import type {
  BwWingSide,
  HeatmapTemplate,
  ValueModeId,
} from "@/lib/options-lab/templates/types";
import type { LadderExpirationContract } from "@/lib/chainLadderApi";

const EXPIRY_PICK_COUNT = 3;

type UniverseRow = {
  symbol: string;
  kind?: string;
  strike_step?: number | null;
  profile?: { strike_step?: number | null } | null;
};

export type HeatmapControlsColumnProps = {
  streaming: boolean;
  held: boolean;
  transport: string | null | undefined;
  error: string | null;
  symbol: string;
  universe: UniverseRow[];
  universeLoading: boolean;
  onSymbolChange: (symbol: string) => void;
  templateId: string;
  tpl: HeatmapTemplate;
  onTemplateChange: (id: string) => void;
  valueMode: ValueModeId;
  onValueModeChange: (mode: ValueModeId) => void;
  bwStrikeCount: number;
  onBwStrikeCountChange: (n: number) => void;
  bwWingSide: BwWingSide;
  onBwWingSideChange: (side: BwWingSide) => void;
  profileLine: string;
  expiration: string;
  expiryContracts: LadderExpirationContract[];
  onExpirationChange: (expiration: string) => void;
  side: "call" | "put";
  onSideChange: (side: "call" | "put") => void;
  rocSensitivity: number;
  onRocSensitivityChange: (v: number) => void;
  onCenterSpot: () => void;
  hasSpotRow: boolean;
  tosScript: string;
  tosCopied: boolean;
  onCopyTos: () => void;
  onOpenAnalyzer: () => void;
  spotLabel: string;
  genLine: string | null;
  dteLine: string | null;
  feedLine: string | null;
  patchLine: string | null;
};

function statusCopy(
  streaming: boolean,
  held: boolean,
  transport: string | null | undefined,
): { label: string; tone: "live" | "held" | "error" | "idle" } {
  if (streaming) return { label: "Live stream", tone: "live" };
  if (held) return { label: "Held", tone: "held" };
  if (transport === "error") return { label: "Stream error", tone: "error" };
  return { label: "Connecting…", tone: "idle" };
}

function SegmentedRow<T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
}) {
  return (
    <div className={inspectorRow + " flex-wrap py-2"}>
      <span className={inspectorRowLabel}>{label}</span>
      <nav
        className="inline-flex min-h-[var(--hit-min)] min-w-0 flex-1 items-center justify-end gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
        aria-label={label}
        data-testid={testId}
      >
        {options.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={active}
              className={[
                "inline-flex min-h-9 flex-1 items-center justify-center rounded-full px-3 text-[length:var(--text-subheadline)] font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                active
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function HeatmapControlsColumn({
  streaming,
  held,
  transport,
  error,
  symbol,
  universe,
  universeLoading,
  onSymbolChange,
  templateId,
  tpl,
  onTemplateChange,
  valueMode,
  onValueModeChange,
  bwStrikeCount,
  onBwStrikeCountChange,
  bwWingSide,
  onBwWingSideChange,
  profileLine,
  expiration,
  expiryContracts,
  onExpirationChange,
  side,
  onSideChange,
  rocSensitivity,
  onRocSensitivityChange,
  onCenterSpot,
  hasSpotRow,
  tosScript,
  tosCopied,
  onCopyTos,
  onOpenAnalyzer,
  spotLabel,
  genLine,
  dteLine,
  feedLine,
  patchLine,
}: HeatmapControlsColumnProps) {
  const status = statusCopy(streaming, held, transport);

  return (
    <aside
      className={inspectorAside}
      aria-label="Chain controls"
      data-testid="heatmap-controls-column"
    >
      <div className={inspectorStickyNav}>
        <div className="flex min-h-[var(--hit-min)] flex-wrap items-center justify-between gap-2">
          <h2 className="text-[length:var(--text-title-3)] font-semibold tracking-tight text-[var(--color-label)]">
            Heatmap
          </h2>
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-2 py-1 " +
              "text-[length:var(--text-caption)] font-medium " +
              (status.tone === "live"
                ? "bg-[var(--color-tint-soft)] text-[var(--color-tint)]"
                : status.tone === "held"
                  ? "bg-[color-mix(in_srgb,var(--color-warning)_16%,transparent)] text-[var(--color-label)]"
                  : status.tone === "error"
                    ? "bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]"
                    : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]")
            }
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (status.tone === "live"
                  ? "bg-[var(--color-tint)]"
                  : status.tone === "held"
                    ? "bg-[var(--color-warning)]"
                    : status.tone === "error"
                      ? "bg-[var(--color-destructive)]"
                      : "bg-[var(--color-label-tertiary)]")
              }
              aria-hidden
            />
            {status.label}
          </span>
        </div>
      </div>

      <div className={inspectorBody}>
        {error ? (
          <div
            className="rounded-[var(--radius-md)] bg-[var(--color-destructive-soft)] px-3 py-2.5 text-[length:var(--text-footnote)] leading-snug text-[var(--color-destructive)]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <InspectorSection title="Instrument">
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Symbol</span>
            <select
              className={inspectorField}
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
              disabled={universeLoading || !universe.length}
              data-testid="options-lab-symbol"
            >
              {universe.map((u) => (
                <option key={u.symbol} value={u.symbol}>
                  {u.symbol}
                  {u.kind ? ` · ${u.kind}` : ""}
                  {u.profile?.strike_step != null
                    ? ` · step ${u.profile.strike_step}`
                    : u.strike_step != null
                      ? ` · step ${u.strike_step}`
                      : ""}
                </option>
              ))}
              {!universe.length && !universeLoading && (
                <option value={symbol}>{symbol}</option>
              )}
            </select>
          </label>
        </InspectorSection>

        <InspectorSection title="Template">
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Template</span>
            <select
              className={inspectorField}
              value={templateId}
              onChange={(e) => onTemplateChange(e.target.value)}
              data-testid="heatmap-template"
            >
              {HEATMAP_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {tpl.valueModes.length > 1 ? (
            <label className={inspectorRow}>
              <span className={inspectorRowLabel}>Value</span>
              <select
                className={inspectorField}
                value={valueMode}
                onChange={(e) =>
                  onValueModeChange(e.target.value as ValueModeId)
                }
                data-testid="heatmap-value-mode"
              >
                {tpl.valueModes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {templateId === "bw-fly" ? (
            <>
              <label className={inspectorRow}>
                <span className={inspectorRowLabel}>Broken wing</span>
                <select
                  className={inspectorField}
                  value={bwStrikeCount}
                  onChange={(e) =>
                    onBwStrikeCountChange(Number(e.target.value))
                  }
                  data-testid="heatmap-bw-strike-count"
                >
                  {BW_STRIKE_COUNT_CHOICES.map((n) => (
                    <option key={n} value={n}>
                      {n} strike{n === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </label>
              <SegmentedRow
                label="Wing side"
                value={bwWingSide}
                options={[
                  { id: "closest", label: "Closest" },
                  { id: "furthest", label: "Furthest" },
                ]}
                onChange={onBwWingSideChange}
                testId="heatmap-bw-wing-side"
              />
            </>
          ) : null}
          <p className={inspectorFooter}>
            {tpl.description}
            <span
              className="mt-1 block"
              data-testid="heatmap-symbol-profile"
            >
              {profileLine}
            </span>
          </p>
        </InspectorSection>

        <InspectorSection title="Chain">
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>
              Contract
            </span>
            <select
              className={inspectorField}
              value={expiration}
              onChange={(e) => onExpirationChange(e.target.value)}
              data-testid="chain-ladder-expiration"
            >
              {!expiration && <option value="">Select…</option>}
              {expiryContracts.map((c) => (
                <option key={c.expiration} value={c.expiration}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <p className="px-3 py-1 text-right text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
            Next {EXPIRY_PICK_COUNT} listed
          </p>
          <SegmentedRow
            label="Side"
            value={side}
            options={[
              { id: "call", label: "Calls" },
              { id: "put", label: "Puts" },
            ]}
            onChange={onSideChange}
            testId="chain-ladder-side"
          />
          <label className={inspectorRow + " flex-col items-stretch gap-1 py-2"}>
            <span className="sr-only">Rate of change color sensitivity</span>
            <div className="flex items-center gap-2 px-3">
              <span
                className="w-4 text-center text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]"
                aria-hidden
              >
                −
              </span>
              <input
                type="range"
                className="min-h-9 w-full accent-[var(--color-tint)]"
                min={0}
                max={100}
                step={1}
                value={rocSensitivity}
                onChange={(e) =>
                  onRocSensitivityChange(Number(e.target.value))
                }
                data-testid="heatmap-roc-sensitivity"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={rocSensitivity}
                aria-label="Color rate-of-change sensitivity"
              />
              <span
                className="w-4 text-center text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]"
                aria-hidden
              >
                +
              </span>
            </div>
          </label>
          <button
            type="button"
            className={inspectorListRow}
            onClick={onCenterSpot}
            disabled={!hasSpotRow}
            data-testid="chain-ladder-center-spot"
          >
            Center spot
          </button>
        </InspectorSection>

        <InspectorSection title="ToS" testId="heatmap-tos-panel">
          <pre
            className={
              "max-h-40 min-h-[4.5rem] overflow-auto whitespace-pre-wrap break-all " +
              "bg-[var(--color-surface-inverse)] px-3 py-2.5 font-mono " +
              "text-[length:var(--text-subheadline)] leading-snug " +
              "text-[var(--color-success)]"
            }
            data-testid="heatmap-tos-script"
            title={
              tosScript ||
              (templateId === "vertical"
                ? "Option-click a vertical tile"
                : templateId === "bw-fly"
                  ? "Option-click a broken-wing tile"
                  : "Option-click a Symmetric flies tile")
            }
          >
            {tosScript ||
              (templateId === "vertical"
                ? "Option-click a tile to generate BUY/SELL VERTICAL … @debit LMT"
                : "Option-click a fly tile to generate BUY/SELL BUTTERFLY … @debit LMT")}
          </pre>
          {tosScript ? (
            <>
              <button
                type="button"
                className={inspectorListRow}
                onClick={onCopyTos}
                data-testid="heatmap-tos-copy"
              >
                {tosCopied ? "Copied" : "Copy again"}
              </button>
              <Link
                href="/app/options-lab/analyzer"
                className={inspectorListRow + " no-underline"}
                data-testid="heatmap-open-analyzer"
                onClick={onOpenAnalyzer}
              >
                <span>Open in Analyzer</span>
                <IconChevronRight
                  size={20}
                  className="text-[var(--color-tint)]"
                />
              </Link>
            </>
          ) : (
            <p className={inspectorFooter}>⌥-click a tile to fill the script</p>
          )}
        </InspectorSection>

        <InspectorSection title="Readout">
          <div className="flex min-h-[var(--hit-min)] flex-col justify-center px-3 py-2">
            <div className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
              Spot
            </div>
            <div className="font-semibold tabular-nums tracking-tight text-[length:var(--text-title-2)] text-[var(--color-label)]">
              {spotLabel}
            </div>
          </div>
          {dteLine || feedLine || genLine || patchLine ? (
            <p className={inspectorFooter}>
              {[dteLine, feedLine, genLine, patchLine]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </InspectorSection>
      </div>
    </aside>
  );
}
