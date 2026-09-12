"use client";

/**
 * Shared card/dialog controls (DLG-VOCAB-1 · 2 · 3 · PC-VOCAB-4 · PC-HIG-5…10).
 * Required `surface` stamps `data-surface`. Appearance is selected from it;
 * behaviour is identical.
 * Card: PC-HIG-8 grow-on-hover, 18px rest. Dialog: --hit-min at rest, no grow.
 * Finding 0: never apply --hit-min at rest on the card; no .split constructions.
 */

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { QTY_QUICK_PICK } from "@/lib/options-lab/tosCard";

export type TosSurface = "card" | "dialog";

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
const H_RULE_DLG = "h-px w-full shrink-0 bg-[var(--color-separator)]";

const dialogHit = {
  minHeight: "var(--hit-min)",
  minWidth: "var(--hit-min)",
} as const;

export function TosStepper({
  surface,
  onUp,
  onDown,
  disabled,
  testId,
  ariaLabel,
}: {
  surface: TosSurface;
  onUp: () => void;
  onDown: () => void;
  disabled?: boolean;
  testId?: string;
  ariaLabel?: string;
}) {
  const card = surface === "card";
  const rule = card ? H_RULE : H_RULE_DLG;
  const buttons = (
    <>
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
      <div className={rule} aria-hidden />
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
    </>
  );
  return (
    <div
      className={
        card
          ? `group/step relative z-0 inline-flex ${REST_H} ${REST_W} hover:z-20 focus-within:z-20`
          : "relative z-0 inline-flex"
      }
      style={card ? undefined : dialogHit}
      data-surface={surface}
      data-tos-stepper-slot="1"
    >
      {card ? (
        <div
          className={
            "tos-stepper absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden " +
            `rounded-sm ${REST_H} ${REST_W} ${FILL} ` +
            growBox
          }
          data-testid={testId}
          data-tos-stepper="1"
          data-resting-h="18"
          data-grown-hit="var(--hit-min)"
          aria-label={ariaLabel}
        >
          {buttons}
        </div>
      ) : (
        <div
          className={
            "tos-stepper inline-flex h-full w-full flex-col overflow-hidden " +
            "rounded-[var(--radius-sm)] bg-[var(--color-fill)] text-[var(--color-label)] " +
            "shadow-[var(--elevation-1)]"
          }
          data-testid={testId}
          data-tos-stepper="1"
          aria-label={ariaLabel}
        >
          {buttons}
        </div>
      )}
    </div>
  );
}

/** QTY: stepper + caret as one butted unit, equal height (ToS). */
export function TosQtyControl({
  surface,
  onUp,
  onDown,
  onPick,
  disabled,
  testId,
  menuPortal = false,
}: {
  surface: TosSurface;
  onUp: () => void;
  onDown: () => void;
  onPick: (n: number) => void;
  disabled?: boolean;
  testId?: string;
  /** Portal the listbox (dialog legs). Card list omits this — markup unchanged. */
  menuPortal?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{ top: number; left: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const openedByPointer = useRef(false);
  const card = surface === "card";
  const portalMenu = surface === "dialog" || menuPortal;
  const rule = card ? H_RULE : H_RULE_DLG;

  const pick = (n: number) => {
    onPick(n);
    setOpen(false);
  };

  const onCaretPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!open) {
      openedByPointer.current = true;
      setOpen(true);
    } else {
      openedByPointer.current = false;
    }
  };
  const onCaretClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (openedByPointer.current) {
      openedByPointer.current = false;
      return;
    }
    setOpen((v) => !v);
  };

  useLayoutEffect(() => {
    if (!open || !portalMenu) {
      setMenuBox(null);
      return;
    }
    const place = () => {
      const caret = caretRef.current;
      const menu = menuRef.current;
      if (!caret) return;
      const rect = caret.getBoundingClientRect();
      const menuHeight = menu?.offsetHeight || QTY_QUICK_PICK.length * 28 + 8;
      const menuWidth = menu?.offsetWidth || 56;
      const flip = rect.bottom + menuHeight + 8 > window.innerHeight;
      let top = flip ? rect.top - menuHeight - 4 : rect.bottom + 4;
      let left = rect.right - menuWidth;
      const m = 8;
      left = Math.max(m, Math.min(window.innerWidth - menuWidth - m, left));
      top = Math.max(m, Math.min(window.innerHeight - menuHeight - m, top));
      setMenuBox({ top, left });
    };
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, portalMenu]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const menuClass = portalMenu
    ? card
      ? "min-w-[3.5rem] rounded bg-[#1a1a22] py-1 shadow-lg ring-1 ring-white/20"
      : "min-w-[3.5rem] rounded-[var(--radius-sm)] bg-[var(--color-surface)] py-1 text-[var(--color-label)] shadow-[var(--elevation-2)] ring-1 ring-[var(--color-separator)]"
    : card
      ? "absolute right-0 top-full z-30 mt-0.5 min-w-[3.5rem] rounded bg-[#1a1a22] py-1 shadow-lg ring-1 ring-white/20"
      : "absolute right-0 top-full z-30 mt-0.5 min-w-[3.5rem] rounded-[var(--radius-sm)] bg-[var(--color-surface)] py-1 text-[var(--color-label)] shadow-[var(--elevation-2)] ring-1 ring-[var(--color-separator)]";
  const optionClass = card
    ? "w-full px-2 py-1 text-right font-mono text-[length:var(--ol-card-data)] text-white hover:bg-white/10"
    : "w-full px-2 py-1 text-right font-mono text-[length:var(--text-body)] text-[var(--color-label)] hover:bg-[var(--color-fill)]";

  const menu = open ? (
    <ul
      ref={menuRef}
      id={id}
      role="listbox"
      className={menuClass}
      style={
        portalMenu
          ? {
              position: "fixed",
              zIndex: 60,
              top: menuBox?.top ?? 0,
              left: menuBox?.left ?? 0,
            }
          : undefined
      }
      data-testid={testId ? `${testId}-menu` : undefined}
    >
      {QTY_QUICK_PICK.map((n) => (
        <li key={n} role="option">
          <button
            type="button"
            className={optionClass}
            data-testid={testId ? `${testId}-${n}` : undefined}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (e.button !== 0) return;
              pick(n);
            }}
            onClick={(e) => {
              e.stopPropagation();
              pick(n);
            }}
          >
            {n}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={
        card
          ? `tos-qty group/step relative z-0 inline-flex ${REST_H} w-[34px] hover:z-20 focus-within:z-20`
          : "tos-qty relative z-0 inline-flex"
      }
      style={
        card
          ? undefined
          : { minHeight: "var(--hit-min)", minWidth: "calc(var(--hit-min) + 1.25rem)" }
      }
      data-surface={surface}
      data-testid={testId}
      data-tos-qty="1"
    >
      {card ? (
        <div
          className={
            "absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-stretch overflow-hidden " +
            `rounded-sm ${REST_H} ${FILL} ` +
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
            <div className={rule} aria-hidden />
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
            ref={caretRef}
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
            onPointerDown={onCaretPointerDown}
            onClick={onCaretClick}
          >
            <CaretDown />
          </button>
        </div>
      ) : (
        <div
          className={
            "inline-flex h-full w-full items-stretch overflow-hidden " +
            "rounded-[var(--radius-sm)] bg-[var(--color-fill)] text-[var(--color-label)] " +
            "shadow-[var(--elevation-1)]"
          }
        >
          <div className="flex min-w-[var(--hit-min)] flex-col self-stretch">
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
            <div className={rule} aria-hidden />
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
            ref={caretRef}
            type="button"
            className={
              "flex min-w-[1.25rem] shrink-0 items-center justify-center self-stretch " +
              "border-l border-[var(--color-separator)]"
            }
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={id}
            aria-label="QTY quick-pick"
            data-testid={testId ? `${testId}-caret` : undefined}
            onPointerDown={onCaretPointerDown}
            onClick={onCaretClick}
          >
            <CaretDown />
          </button>
        </div>
      )}
      {portalMenu && menu && typeof document !== "undefined"
        ? createPortal(menu, document.body)
        : menu}
    </div>
  );
}

/**
 * Card padlock (PC-HIG-5 · AT-PC-66 · PC8-E).
 * One colour — white — both states. State is fill + shackle, never tint/opacity.
 * Locked: solid body, closed shackle. Unlocked: outlined body, shackle open
 * and swung clear of the right shoulder. Identical 22×18 footprint.
 */
const PADLOCK_PAINT = "#ffffff";
const PADLOCK_W = 22;
const PADLOCK_H = 18;
const PADLOCK_STROKE = 1.5;

function TosPadlockGlyph({
  locked,
  paint,
}: {
  locked: boolean;
  paint: string;
}) {
  return (
    <svg
      width={PADLOCK_W}
      height={PADLOCK_H}
      viewBox={`0 0 ${PADLOCK_W} ${PADLOCK_H}`}
      className="block"
      aria-hidden
      data-lock-state={locked ? "locked" : "unlocked"}
      data-lock-shackle={locked ? "over" : "left"}
      data-lock-body="solid"
      data-padlock-footprint="22x18"
    >
      <path
        d={
          locked
            ? "M 8.2 8.6 V 5.6 A 2.8 2.8 0 0 1 13.8 5.6 V 8.6"
            : "M 8.2 8.6 V 5.6 A 2.8 2.8 0 0 0 2.8 6.2"
        }
        fill="none"
        stroke={paint}
        strokeWidth={PADLOCK_STROKE}
        strokeLinecap="round"
      />
      <rect x="6" y="7.8" width="10" height="9.2" rx="1.8" fill={paint} />
    </svg>
  );
}

export function TosPadlock({
  surface,
  locked,
  onToggle,
  testId,
  className = "",
}: {
  surface: TosSurface;
  locked: boolean;
  onToggle: () => void;
  testId?: string;
  className?: string;
}) {
  const card = surface === "card";
  return (
    <button
      type="button"
      className={
        card
          ? "inline-flex h-[18px] w-[22px] shrink-0 items-center justify-center leading-none " +
            (className ? ` ${className}` : "")
          : "inline-flex shrink-0 items-center justify-center leading-none text-[var(--color-label)]" +
            (className ? ` ${className}` : "")
      }
      style={card ? undefined : dialogHit}
      title={locked ? "Unlock package basis" : "Lock at natural mid"}
      aria-label={locked ? "Unlock" : "Lock natural"}
      data-surface={surface}
      data-testid={testId}
      data-locked={locked ? "1" : "0"}
      data-padlock-form="tos"
      data-padlock-footprint="22x18"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <TosPadlockGlyph
        locked={locked}
        paint={card ? PADLOCK_PAINT : "currentColor"}
      />
    </button>
  );
}

/** Card / dialog type scale (PC-VOCAB-1). */
export const OL_DATA = "text-[length:var(--ol-card-data)]";
export const OL_CHROME = "text-[length:var(--ol-card-chrome)]";
/** Lighter than the row; no border. Distinguishes editable from read-only. */
export const FIELD_FILL = "bg-white/12";
/** Native <select> ignores h-* unless appearance is reset; floor = row (18px). */
export const cardSelect =
  `h-[18px] max-h-[18px] min-h-0 w-full appearance-none cursor-pointer border-0 ${FIELD_FILL} ` +
  `py-0 pl-1 pr-1.5 outline-none leading-[18px] ${OL_DATA} text-white`;
/** Card table header / cell — dialog legs panel uses these, not a restyle. */
export const CARD_TH =
  `px-1 py-0.5 text-left ${OL_CHROME} font-normal uppercase tracking-wide text-white/55 whitespace-nowrap`;
export const CARD_TD = `px-1 ${OL_DATA} font-normal tabular-nums whitespace-nowrap`;
/** Card list header band — dialog legs thead uses this, not a restyle. */
export const CARD_THEAD =
  "bg-[#0a0a0e] shadow-[0_1px_0_rgba(255,255,255,0.12)]";
/** macOS traffic-light close on the dialog window chrome. */
export const WINDOW_CLOSE_DOT = "h-3 w-3 rounded-full bg-[#ff5f57]";

/** Corner-nested menu marker (ToS). Not a hit target. One component for card and dialog. */
export function CardMenuField({
  surface,
  children,
  fit = "full",
}: {
  surface: TosSurface;
  children: ReactNode;
  fit?: "full" | "min";
}) {
  const card = surface === "card";
  return (
    <span
      className={
        card
          ? "relative inline-flex h-[18px] max-h-[18px] min-w-0 items-stretch overflow-visible rounded-sm " +
            (fit === "min" ? "w-auto" : "w-full")
          : "relative inline-flex min-w-0 items-stretch overflow-visible rounded-[var(--radius-sm)] " +
            (fit === "min" ? "w-auto" : "w-full")
      }
      style={card ? undefined : { minHeight: "var(--hit-min)" }}
      data-surface={surface}
    >
      {children}
      <span
        className={
          "pointer-events-none absolute bottom-0 right-0 block " +
          (card ? "h-[6px] w-[6px]" : "aspect-square h-1/3")
        }
        aria-hidden
        data-menu-triangle="1"
      >
        <svg
          width={card ? 6 : "100%"}
          height={card ? 6 : "100%"}
          viewBox="0 0 6 6"
          aria-hidden
          className="block h-full w-full"
        >
          <polygon
            points="6,6 0,6 6,0"
            fill={card ? "#ffffff" : "var(--color-menu-marker)"}
          />
        </svg>
      </span>
    </span>
  );
}
