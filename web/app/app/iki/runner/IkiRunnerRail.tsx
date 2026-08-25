"use client";

/**
 * IKI-P3 — Heatmap-style inspector rail (HM §6.1).
 * Import inspectorChrome as-is. Hide inapplicable controls (B2).
 */

import {
  InspectorSection,
  inspectorAside,
  inspectorBody,
  inspectorField,
  inspectorFooter,
  inspectorRow,
  inspectorRowLabel,
  inspectorStickyNav,
} from "@/components/options-lab/inspectorChrome";
import type { LadderExpirationContract } from "@/lib/chainLadderApi";

const EXPIRY_PICK_COUNT = 3;

export type StreamTone = "live" | "held" | "error" | "idle";

type UniverseRow = {
  symbol: string;
  kind?: string;
  strike_step?: number | null;
  profile?: { strike_step?: number | null } | null;
};

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

export default function IkiRunnerRail({
  statusLabel,
  statusTone,
  error,
  symbol,
  universe,
  universeLoading,
  onSymbolChange,
  tplKey,
  onTplKey,
  taxSide,
  onTaxSide,
  minOi,
  onMinOi,
  expiration,
  expiryContracts,
  onExpirationChange,
  viewSide,
  onViewSide,
  spotLabel,
  genLine,
  dteLine,
  epochLine,
}: {
  statusLabel: string;
  statusTone: StreamTone;
  error: string | null;
  symbol: string;
  universe: UniverseRow[];
  universeLoading: boolean;
  onSymbolChange: (symbol: string) => void;
  tplKey: string;
  onTplKey: (key: string) => void;
  taxSide: string;
  onTaxSide: (side: string) => void;
  minOi: number;
  onMinOi: (n: number) => void;
  expiration: string;
  expiryContracts: LadderExpirationContract[];
  onExpirationChange: (expiration: string) => void;
  viewSide: "call" | "put";
  onViewSide: (side: "call" | "put") => void;
  spotLabel: string;
  genLine: string | null;
  dteLine: string | null;
  epochLine: string | null;
}) {
  const spreadTax = tplKey === "spread-tax@0.1";

  return (
    <aside
      className={inspectorAside}
      aria-label="Runner controls"
      data-testid="iki-runner-rail"
    >
      <div className={inspectorStickyNav}>
        <div className="flex min-h-[var(--hit-min)] flex-wrap items-center justify-between gap-2">
          <h2 className="text-[length:var(--text-title-3)] font-semibold tracking-tight text-[var(--color-label)]">
            Runner
          </h2>
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-2 py-1 " +
              "text-[length:var(--text-caption)] font-medium " +
              (statusTone === "live"
                ? "bg-[var(--color-tint-soft)] text-[var(--color-tint)]"
                : statusTone === "held"
                  ? "bg-[color-mix(in_srgb,var(--color-warning)_16%,transparent)] text-[var(--color-label)]"
                  : statusTone === "error"
                    ? "bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]"
                    : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]")
            }
            data-testid="iki-runner-stream-status"
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (statusTone === "live"
                  ? "bg-[var(--color-tint)]"
                  : statusTone === "held"
                    ? "bg-[var(--color-warning)]"
                    : statusTone === "error"
                      ? "bg-[var(--color-destructive)]"
                      : "bg-[var(--color-label-tertiary)]")
              }
              aria-hidden
            />
            {statusLabel}
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
              data-testid="iki-runner-symbol"
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
              value={tplKey}
              onChange={(e) => onTplKey(e.target.value)}
              data-testid="iki-runner-template"
            >
              <option value="sym-fly@0.2">Advanced flies</option>
              <option value="spread-tax@0.1">Spread Tax Map</option>
            </select>
          </label>
          {spreadTax ? (
            <>
              <label className={inspectorRow}>
                <span className={inspectorRowLabel}>Map</span>
                <select
                  className={inspectorField}
                  value={taxSide}
                  onChange={(e) => onTaxSide(e.target.value)}
                  data-testid="spread-tax-side"
                >
                  <option value="both">both</option>
                  <option value="call">call</option>
                  <option value="put">put</option>
                </select>
              </label>
              <label className={inspectorRow}>
                <span className={inspectorRowLabel}>min OI</span>
                <input
                  type="number"
                  min={0}
                  className={inspectorField}
                  value={minOi}
                  data-testid="spread-tax-min-oi"
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) onMinOi(n);
                  }}
                />
              </label>
            </>
          ) : null}
        </InspectorSection>

        <InspectorSection title="Chain">
          <label className={inspectorRow}>
            <span className={inspectorRowLabel}>Contract</span>
            <select
              className={inspectorField}
              value={expiration}
              onChange={(e) => onExpirationChange(e.target.value)}
              data-testid="iki-runner-expiration"
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
            value={viewSide}
            options={[
              { id: "call", label: "Calls" },
              { id: "put", label: "Puts" },
            ]}
            onChange={onViewSide}
            testId="iki-runner-side"
          />
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
          {dteLine || genLine || epochLine ? (
            <p className={inspectorFooter}>
              {[dteLine, genLine, epochLine].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </InspectorSection>
      </div>
    </aside>
  );
}
