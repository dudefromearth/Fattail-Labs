"use client";

/**
 * Trade Log page chrome — Apple HIG (Echo packet TL-echo-header-hig).
 * Domain ToS skin is table body only; this toolbar stays kit + tokens.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { IconChevronDown, IconPlus } from "@/components/ui/icons";
import type { Account } from "@/lib/tradeLog";

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

const selectClass =
  "min-h-[var(--hit-min)] cursor-pointer appearance-none rounded-[var(--radius-full)] border-0 bg-[var(--color-fill)] py-2 pl-4 pr-9 text-sm font-medium text-[var(--color-label)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";

export default function TradeLogToolbar({
  activeAccounts,
  accountId,
  onAccountId,
  accountsOpen,
  onToggleAccounts,
  onImport,
  onNewTrade,
  onExport,
  nativeVenueLabel,
}: {
  activeAccounts: Account[];
  accountId: number | "all";
  onAccountId: (id: number | "all") => void;
  accountsOpen: boolean;
  onToggleAccounts: () => void;
  onImport: () => void;
  onNewTrade: () => void;
  onExport: (format: string) => void;
  nativeVenueLabel: string;
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
      </div>

      <div
        className="flex flex-wrap items-center gap-2 sm:justify-end"
        role="toolbar"
        aria-label="Trade Log actions"
      >
        {/* Scope filter — not a competing CTA */}
        <label className="relative inline-flex min-h-[var(--hit-min)] items-center">
          <span className="sr-only">Account</span>
          <select
            className={selectClass}
            value={accountId === "all" ? "all" : String(accountId)}
            onChange={(e) => {
              const v = e.target.value;
              onAccountId(v === "all" ? "all" : Number(v));
            }}
            aria-label="Filter by account"
          >
            <option value="all">All active</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
                {a.broker && a.broker !== "unset" ? ` · ${a.broker}` : ""}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-label-secondary)]">
            <IconChevronDown size={16} />
          </span>
        </label>

        <Button type="button" variant="secondary" onClick={onImport}>
          Import
        </Button>

        <div className="relative" ref={exportWrapRef}>
          <Button
            type="button"
            variant="secondary"
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            aria-controls={menuId}
            onClick={() => setExportOpen((o) => !o)}
          >
            Export
            <IconChevronDown size={16} />
          </Button>
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
                      fmt.value === "native"
                        ? "native"
                        : fmt.value,
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

        <Button
          type="button"
          variant={accountsOpen ? "tint" : "plain"}
          onClick={onToggleAccounts}
          aria-expanded={accountsOpen}
        >
          Accounts
        </Button>

        <Button type="button" variant="primary" onClick={onNewTrade}>
          <IconPlus size={18} />
          New trade
        </Button>
      </div>
    </div>
  );
}
