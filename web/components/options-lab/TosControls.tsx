"use client";

/**
 * Shared ToS card/dialog controls (PC-VOCAB-1 · 4 · PC-HIG-5…10).
 * Resting size is explicit and symmetric. --hit-min is grown-only (PC-HIG-8).
 * Finding 0: never apply --hit-min at rest; no .split constructions.
 */

import { useId, useState } from "react";
import { IconLock, IconUnlock } from "@/components/ui/icons";
import { QTY_QUICK_PICK } from "@/lib/options-lab/tosCard";

/** Resting unit height = data row. Grown uses --hit-min. */
const REST_H = "h-[18px]";
const REST_W = "w-[16px]";
const CARET_W = "w-[18px]";
/** Saturated fill — not bg-black/30 at opacity-40 (a hole in the card). */
const FILL = "bg-black/80 text-white";
const DIV = "border-white/40";

function PlusBar() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <rect x="0" y="3" width="8" height="2" fill="currentColor" />
      <rect x="3" y="0" width="2" height="8" fill="currentColor" />
    </svg>
  );
}

function MinusBar() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <rect x="0" y="3" width="8" height="2" fill="currentColor" />
    </svg>
  );
}

function CaretDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <polygon points="1,2.5 9,2.5 5,8" fill="currentColor" />
    </svg>
  );
}

/** Grown --hit-min on the unit, never on a resting segment. */
const growBox =
  "group-hover/step:min-h-[var(--hit-min)] group-hover/step:min-w-[var(--hit-min)] " +
  "group-focus-within/step:min-h-[var(--hit-min)] group-focus-within/step:min-w-[var(--hit-min)]";

const seg =
  "flex min-h-0 flex-1 w-full items-center justify-center leading-none disabled:opacity-30";
/** Dedicated 1px rule — a border on one segment made rest lopsided. */
const H_RULE = "h-px w-full shrink-0 bg-white/40";

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
    <div className="group/step relative z-0 inline-flex hover:z-20 focus-within:z-20">
      <div
        className={
          "tos-stepper inline-flex flex-col overflow-hidden " +
          `rounded-sm ${REST_H} ${REST_W} ${FILL} ` +
          growBox
        }
        data-testid={testId}
        data-tos-stepper="1"
        data-resting-h="18"
        data-grown-hit="var(--hit-min)"
        aria-label={ariaLabel}
      >
        <button
          type="button"
          disabled={disabled}
          className={seg}
          aria-label={ariaLabel ? `${ariaLabel} up` : "Increment"}
          data-testid={testId ? `${testId}-up` : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onUp();
          }}
        >
          <PlusBar />
        </button>
        <div className={H_RULE} aria-hidden />
        <button
          type="button"
          disabled={disabled}
          className={seg}
          aria-label={ariaLabel ? `${ariaLabel} down` : "Decrement"}
          data-testid={testId ? `${testId}-down` : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onDown();
          }}
        >
          <MinusBar />
        </button>
      </div>
    </div>
  );
}

/** QTY: stepper + caret as one butted unit, equal height (ToS). */
export function TosQtyControl({
  onUp,
  onDown,
  onPick,
  disabled,
  testId,
}: {
  onUp: () => void;
  onDown: () => void;
  onPick: (n: number) => void;
  disabled?: boolean;
  testId?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div
      className="tos-qty group/step relative z-0 inline-flex hover:z-20 focus-within:z-20"
      data-testid={testId}
      data-tos-qty="1"
    >
      <div
        className={
          `inline-flex items-stretch overflow-hidden rounded-sm ${REST_H} ${FILL} ` +
          growBox
        }
        data-resting-h="18"
        data-grown-hit="var(--hit-min)"
      >
        <div className={`flex ${REST_W} flex-col self-stretch`}>
          <button
            type="button"
            disabled={disabled}
            className={seg}
            aria-label="POS up"
            data-testid={testId ? `${testId}-up` : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onUp();
            }}
          >
            <PlusBar />
          </button>
          <div className={H_RULE} aria-hidden />
          <button
            type="button"
            disabled={disabled}
            className={seg}
            aria-label="POS down"
            data-testid={testId ? `${testId}-down` : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onDown();
            }}
          >
            <MinusBar />
          </button>
        </div>
        <button
          type="button"
          className={
            `flex ${CARET_W} shrink-0 items-center justify-center self-stretch ` +
            `${DIV} border-l`
          }
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
          <CaretDown />
        </button>
      </div>
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
                className="w-full px-2 py-1 text-right font-mono text-[11px] text-white hover:bg-white/10"
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
        "inline-flex h-4 w-4 items-center justify-center overflow-visible rounded " +
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
        <IconLock size={12} tone="light" />
      ) : (
        <IconUnlock size={12} tone="light" />
      )}
    </button>
  );
}
