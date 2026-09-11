"use client";

/**
 * Shared ToS card/dialog controls (PC-VOCAB-1 · 4 · PC-HIG-5…10).
 * One stepper, one padlock pair, one QTY quick-pick — two call sites.
 */

import { useId, useState } from "react";
import { IconLock, IconUnlock } from "@/components/ui/icons";
import { QTY_QUICK_PICK } from "@/lib/options-lab/tosCard";

/** Grown hit target. Resting may be smaller than --hit-min (PC-HIG-8). */
const GROWN =
  "min-h-[var(--hit-min)] min-w-[var(--hit-min)]";

export function TosStepper({
  onUp,
  onDown,
  disabled,
  testId,
  ariaLabel,
}: {
  onUp: () => void;
  onDown: () => void;
  disabled?: boolean;
  testId?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={
        "tos-stepper group/step relative z-0 inline-flex flex-col overflow-visible " +
        "rounded opacity-40 transition-[opacity,transform] duration-150 " +
        "hover:z-20 hover:opacity-100 focus-within:z-20 focus-within:opacity-100 " +
        "hover:scale-125 focus-within:scale-125"
      }
      data-testid={testId}
      data-tos-stepper="1"
      data-grown-hit="var(--hit-min)"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        disabled={disabled}
        className={
          "flex h-3.5 w-5 items-center justify-center rounded-t bg-black/30 text-[11px] " +
          "leading-none text-white/80 hover:bg-black/50 disabled:opacity-30 " +
          "group-hover/step:h-[calc(var(--hit-min)/2)] group-hover/step:w-[var(--hit-min)] " +
          "group-focus-within/step:h-[calc(var(--hit-min)/2)] group-focus-within/step:w-[var(--hit-min)] " +
          GROWN.split(" ")[0]
        }
        aria-label={ariaLabel ? `${ariaLabel} up` : "Increment"}
        data-testid={testId ? `${testId}-up` : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onUp();
        }}
      >
        +
      </button>
      <button
        type="button"
        disabled={disabled}
        className={
          "flex h-3.5 w-5 items-center justify-center rounded-b bg-black/30 text-[11px] " +
          "leading-none text-white/80 hover:bg-black/50 disabled:opacity-30 " +
          "group-hover/step:h-[calc(var(--hit-min)/2)] group-hover/step:w-[var(--hit-min)] " +
          "group-focus-within/step:h-[calc(var(--hit-min)/2)] group-focus-within/step:w-[var(--hit-min)]"
        }
        aria-label={ariaLabel ? `${ariaLabel} down` : "Decrement"}
        data-testid={testId ? `${testId}-down` : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onDown();
        }}
      >
        −
      </button>
    </div>
  );
}

export function TosPadlock({
  locked,
  onToggle,
  testId,
  className = "",
}: {
  locked: boolean;
  onToggle: () => void;
  testId?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={
        "inline-flex h-8 w-8 items-center justify-center overflow-visible rounded " +
        (locked ? "bg-black/20 hover:bg-black/35" : "bg-black/10 opacity-90 hover:bg-black/25") +
        (className ? ` ${className}` : "")
      }
      title={locked ? "Unlock package basis" : "Lock at natural mid"}
      aria-label={locked ? "Unlock" : "Lock natural"}
      data-testid={testId}
      data-locked={locked ? "1" : "0"}
      data-padlock-form="tos"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {locked ? (
        <IconLock size={18} tone="light" />
      ) : (
        <IconUnlock size={18} tone="light" />
      )}
    </button>
  );
}

export function TosQtyQuickPick({
  onPick,
  testId,
}: {
  onPick: (n: number) => void;
  testId?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex" data-testid={testId}>
      <button
        type="button"
        className="px-0.5 text-[12px] leading-none text-white/50 hover:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label="QTY quick-pick"
        data-testid={testId ? `${testId}-caret` : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ▾
      </button>
      {open ? (
        <ul
          id={id}
          role="listbox"
          className="absolute right-0 top-full z-30 mt-0.5 min-w-[3.5rem] rounded bg-[#1a1a22] py-1 shadow-lg ring-1 ring-white/20"
          data-testid={testId ? `${testId}-menu` : undefined}
        >
          {QTY_QUICK_PICK.map((n) => (
            <li key={n} role="option">
              <button
                type="button"
                className="w-full px-2 py-1 text-right font-mono text-[16px] text-white hover:bg-white/10"
                data-testid={testId ? `${testId}-${n}` : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  onPick(n);
                  setOpen(false);
                }}
              >
                {n}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
