"use client";

/**
 * Trade Log page chrome — Apple HIG (Echo packet TL-echo-header-hig).
 * Account scope lives in Practice chrome (Context Spec v0.2).
 * Domain ToS skin is table body only; this toolbar stays kit + tokens.
 *
 * HIG grouping: Import · Export share one transfer group (segmented
 * container); New trade is a separate primary action.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { IconChevronDown, IconPlus } from "@/components/ui/icons";

const EXPORT_FORMATS: { value: string; label: string; hint?: string }[] = [
  {
    value: "canonical",
    label: "FatTail canonical",
    hint: "JSON · full fidelity",
  },
  {
    value: "native",
    label: "Account native",
    hint: "Matches venue when set",
  },
  {
    value: "thinkorswim",
    label: "thinkorswim CSV",
    hint: "ToS trade history shape",
  },
  {
    value: "csv",
    label: "Flat legs CSV",
    hint: "One row per leg",
  },
];

const groupBtn =
  "inline-flex min-h-9 items-center justify-center gap-1.5 px-3.5 text-sm font-medium transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
  "disabled:pointer-events-none disabled:opacity-45";

export default function TradeLogToolbar({
  onImport,
  onNewTrade,
  onExport,
  nativeVenueLabel,
  accountLabel,
}: {
  onImport: () => void;
  onNewTrade: () => void;
  onExport: (format: string) => void;
  nativeVenueLabel: string;
  /** Stated account from Practice context (always named). */
  accountLabel: string;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportWrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!exportOpen) return;
    function onDoc(e: MouseEvent) {
      if (
        exportWrapRef.current &&
        !exportWrapRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExportOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportOpen]);

  return (
    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1
          className="font-semibold tracking-tight text-[var(--color-label)]"
          style={{ fontSize: "var(--text-title-1)", lineHeight: 1.15 }}
        >
          Trade Log
        </h1>
        <p
          className="mt-1 max-w-xl text-[var(--color-label-secondary)]"
          style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.4 }}
        >
          Options-first blotter — multi-leg groups, process on the side. Never
          leave the log.
        </p>
        <p
          className="mt-1 text-xs text-[var(--color-label-tertiary)]"
          data-testid="trade-log-account-scope"
        >
          Showing:{" "}
          <span className="font-medium text-[var(--color-label-secondary)]">
            {accountLabel}
          </span>
        </p>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 sm:justify-end"
        role="toolbar"
        aria-label="Trade Log actions"
      >
        {/* Transfer group — Import · Export (HIG: related I/O, one control group) */}
        <div
          className="inline-flex items-stretch overflow-hidden rounded-full bg-[var(--color-fill)] p-0.5"
          role="group"
          aria-label="Import and export"
          data-testid="trade-log-transfer-group"
        >
          <button
            type="button"
            onClick={onImport}
            className={[
              groupBtn,
              "rounded-full text-[var(--color-label)] hover:bg-[var(--color-surface)]/80",
            ].join(" ")}
            data-testid="trade-log-import"
          >
            Import
          </button>
          <span
            className="my-1.5 w-px shrink-0 bg-[var(--color-separator)]"
            aria-hidden
          />
          <div className="relative" ref={exportWrapRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              aria-controls={menuId}
              onClick={() => setExportOpen((o) => !o)}
              className={[
                groupBtn,
                "rounded-full text-[var(--color-label)] hover:bg-[var(--color-surface)]/80",
                exportOpen ? "bg-[var(--color-surface)] shadow-[var(--elevation-1)]" : "",
              ].join(" ")}
              data-testid="trade-log-export"
            >
              Export
              <IconChevronDown size={16} />
            </button>
            {exportOpen && (
              <div
                id={menuId}
                role="menu"
                aria-label="Export format"
                className="absolute right-0 z-30 mt-1 w-[min(100vw-2rem,16.5rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] py-1 shadow-[var(--elevation-2)]"
              >
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.value}
                    type="button"
                    role="menuitem"
                    className="flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--color-fill)] focus-visible:bg-[var(--color-fill)] focus-visible:outline-none"
                    onClick={() => {
                      setExportOpen(false);
                      onExport(
                        fmt.value === "native" ? "native" : fmt.value,
                      );
                    }}
                  >
                    <span className="text-sm font-medium text-[var(--color-label)]">
                      {fmt.value === "native"
                        ? `Account native (${nativeVenueLabel})`
                        : fmt.label}
                    </span>
                    {fmt.hint && (
                      <span className="text-[12px] text-[var(--color-label-tertiary)]">
                        {fmt.hint}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Primary create — separate group from transfer */}
        <Button type="button" variant="primary" onClick={onNewTrade}>
          <IconPlus size={18} />
          New trade
        </Button>
      </div>
    </div>
  );
}
