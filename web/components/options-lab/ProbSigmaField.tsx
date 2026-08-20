"use client";

/**
 * Probability mass % — one combo like ToS: value left, +/− stacked,
 * chevron on the right. Preset menu is the full width of that combo.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconChevronDown,
  IconMinus,
  IconPlus,
} from "@/components/ui/icons";
import {
  inspectorRow,
  inspectorRowLabel,
} from "@/components/options-lab/inspectorChrome";
import {
  clampMassPct,
  formatMassPct,
  massInsideSigmaPct,
  matchingSigmaPreset,
} from "@/lib/options-lab/probRange";

const STEP = 0.01;

export default function ProbSigmaField({
  label,
  pct,
  onChange,
  presets,
  disabled,
  testId,
  ariaLabel,
}: {
  label: string;
  pct: number;
  onChange: (pct: number) => void;
  presets: readonly number[];
  disabled: boolean;
  testId: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(() => formatMassPct(pct));
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (editing) return;
    setDraft(formatMassPct(pct));
  }, [pct, editing]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }
    const place = () => {
      const el = boxRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuBox({ left: r.left, top: r.bottom + 2, width: r.width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const commit = (raw: string) => {
    const n = Number(raw.replace(/%/g, "").trim());
    if (!Number.isFinite(n)) {
      setDraft(formatMassPct(pct));
      return;
    }
    onChange(clampMassPct(n));
  };

  const bump = (dir: 1 | -1) => {
    onChange(clampMassPct(pct + dir * STEP));
  };

  const pickSigma = (s: number) => {
    const p = massInsideSigmaPct(s);
    if (p == null) return;
    onChange(p);
    setOpen(false);
  };

  const matched = matchingSigmaPreset(pct, presets);
  const shown = editing ? draft : `${formatMassPct(pct)}%`;

  const cell =
    "flex flex-1 items-center justify-center text-[var(--color-label)] " +
    "hover:bg-white/10 disabled:opacity-45";

  return (
    <div className={inspectorRow}>
      <span className={inspectorRowLabel}>{label}</span>
      <div ref={boxRef} className="relative min-w-0 flex-1">
        <div
          className={
            "flex min-h-[var(--hit-min)] overflow-hidden rounded-[var(--radius-md)] " +
            "border border-[var(--color-separator)] bg-[var(--color-fill)]"
          }
        >
          <input
            className={
              "min-h-[var(--hit-min)] min-w-0 flex-1 bg-transparent px-2 " +
              "text-left font-mono tabular-nums text-[length:var(--text-subheadline)] " +
              "text-[var(--color-label)] outline-none " +
              "focus-visible:bg-[var(--color-fill)]/80 disabled:opacity-45"
            }
            type="text"
            inputMode="decimal"
            value={shown}
            disabled={disabled}
            onFocus={() => {
              setEditing(true);
              setDraft(formatMassPct(pct));
              setOpen(false);
            }}
            onChange={(e) => setDraft(e.target.value.replace(/%/g, ""))}
            onBlur={() => {
              setEditing(false);
              commit(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                bump(1);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                bump(-1);
              }
              if (e.key === "Escape") {
                setDraft(formatMassPct(pct));
                setEditing(false);
                (e.target as HTMLInputElement).blur();
              }
            }}
            data-testid={testId}
            aria-label={ariaLabel}
          />
          <div className="flex w-7 shrink-0 flex-col border-l border-[var(--color-separator)]">
            <button
              type="button"
              className={cell + " border-b border-[var(--color-separator)]"}
              disabled={disabled}
              aria-label={`Increase ${label}`}
              data-testid={`${testId}-up`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => bump(1)}
            >
              <IconPlus size={12} />
            </button>
            <button
              type="button"
              className={cell}
              disabled={disabled}
              aria-label={`Decrease ${label}`}
              data-testid={`${testId}-down`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => bump(-1)}
            >
              <IconMinus size={12} />
            </button>
          </div>
          <button
            type="button"
            className={
              "flex w-7 shrink-0 items-center justify-center border-l " +
              "border-[var(--color-separator)] text-[var(--color-label)] " +
              "hover:bg-white/10 disabled:opacity-45"
            }
            disabled={disabled}
            aria-label={`${label} sigma presets`}
            aria-expanded={open}
            aria-haspopup="listbox"
            data-testid={`${testId}-sigma`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((v) => !v)}
          >
            <IconChevronDown size={14} />
          </button>
        </div>
        {open && !disabled && menuBox && typeof document !== "undefined"
          ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            className={
              "overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-separator)] " +
              "bg-[var(--color-surface)] py-1 shadow-[var(--elevation-3)]"
            }
            style={{
              position: "fixed",
              left: menuBox.left,
              top: menuBox.top,
              width: menuBox.width,
              zIndex: 200,
            }}
            data-testid={`${testId}-sigma-menu`}
          >
            {presets.map((s) => {
              const p = massInsideSigmaPct(s);
              const sigmaLab = Number.isInteger(s) ? `${s}.0` : String(s);
              const on = matched === s;
              return (
                <li key={s} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={
                      "flex w-full items-center justify-between px-3 py-2 " +
                      "text-left text-[length:var(--text-subheadline)] " +
                      (on
                        ? "bg-[var(--color-tint-soft)] text-[var(--color-tint)]"
                        : "text-[var(--color-label)] hover:bg-white/10")
                    }
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSigma(s)}
                  >
                    <span>
                      {sigmaLab}σ
                    </span>
                    {p != null ? (
                      <span className="font-mono tabular-nums text-[var(--color-label-secondary)]">
                        {formatMassPct(p)}%
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        ) : null}
      </div>
    </div>
  );
}
