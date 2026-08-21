"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import IconButton from "./IconButton";
import { IconXMark } from "./icons";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** AZ-ALB work-surface: pin HI dark tokens on this subtree. */
  workSurface?: "dark";
  testId?: string;
  widthClass?: string;
  /**
   * Work-surface panel (Position Builder grammar): no scrim, canvas stays
   * live, drag the header. Esc / Close / Cancel still dismiss.
   */
  floatable?: boolean;
};

const FLOAT_W = 512;
const FLOAT_DEFAULT = { x: 48, y: 72 };

/** Left of the Analyzer canvas — next to Create alert, not the far right. */
function defaultFloatPos(): { x: number; y: number } {
  const w = typeof window !== "undefined" ? window.innerWidth : FLOAT_W + 96;
  const canvas =
    typeof document !== "undefined"
      ? document.querySelector("[data-testid='pnl-chart-host']")
      : null;
  const canvasLeft = canvas?.getBoundingClientRect().left;
  const preferred =
    canvasLeft != null && Number.isFinite(canvasLeft)
      ? canvasLeft + 12
      : FLOAT_DEFAULT.x;
  const maxX = Math.max(16, w - Math.min(FLOAT_W, w - 32) - 16);
  const x = Math.max(16, Math.min(preferred, maxX));
  return { x: Number.isFinite(x) ? x : FLOAT_DEFAULT.x, y: FLOAT_DEFAULT.y };
}

/**
 * HI Spec Modal — scrim, Esc cancels, IconButton xmark close.
 * `floatable` is the Analyzer work-surface dialect (no scrim, draggable).
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  workSurface,
  testId,
  widthClass = "w-full max-w-[32rem]",
  floatable = false,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [pos, setPos] = useState(FLOAT_DEFAULT);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    if (!floatable) {
      panelRef.current?.querySelector<HTMLElement>("[data-modal-close]")?.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (!floatable) prev?.focus?.();
    };
  }, [open, floatable]);

  useEffect(() => {
    if (!open || !floatable) return;
    setPos(defaultFloatPos());
  }, [open, floatable]);

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("button, input, select, textarea, a, label")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const maxX =
      typeof window !== "undefined"
        ? Math.max(8, window.innerWidth - 120)
        : 2000;
    const maxY =
      typeof window !== "undefined"
        ? Math.max(8, window.innerHeight - 48)
        : 1200;
    setPos({
      x: Math.min(maxX, Math.max(8, d.origX + (e.clientX - d.startX))),
      y: Math.min(maxY, Math.max(8, d.origY + (e.clientY - d.startY))),
    });
  };

  const onHandlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  if (!open) return null;

  const panelClass =
    "flex max-h-[85vh] flex-col overflow-hidden " +
    "rounded-[var(--radius-lg)] bg-[var(--color-surface)] " +
    "text-[var(--color-label)] shadow-[var(--elevation-3)] " +
    (floatable
      ? "w-[min(32rem,calc(100vw-1.5rem))]"
      : widthClass);

  const header = (
    <div
      className={
        "flex min-h-[var(--hit-min)] items-center gap-2 border-b border-[var(--color-separator)] px-4" +
        (floatable ? " cursor-grab active:cursor-grabbing" : "")
      }
      onPointerDown={floatable ? onHandlePointerDown : undefined}
      onPointerMove={floatable ? onHandlePointerMove : undefined}
      onPointerUp={floatable ? onHandlePointerUp : undefined}
      onPointerCancel={floatable ? onHandlePointerUp : undefined}
      data-testid={floatable ? "modal-drag-handle" : undefined}
      title={floatable ? "Drag to move" : undefined}
    >
      <IconButton label="Close" data-modal-close onClick={onClose}>
        <IconXMark size={20} />
      </IconButton>
      <h2
        id={titleId}
        className="min-w-0 flex-1 truncate text-center text-[length:var(--text-headline)] font-semibold"
      >
        {title}
      </h2>
      <span className="inline-block min-h-[var(--hit-min)] min-w-[var(--hit-min)]" />
    </div>
  );

  const body = (
    <>
      {header}
      <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-3 border-t border-[var(--color-separator)] px-6 py-4">
          {footer}
        </div>
      ) : null}
    </>
  );

  if (floatable) {
    return (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        data-work-surface={workSurface}
        data-testid={testId}
        data-floatable="1"
        className={"fixed z-[80] " + panelClass}
        style={{ left: pos.x, top: pos.y }}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="presentation"
      data-testid={testId}
    >
      <div
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-work-surface={workSurface}
        className={"relative " + panelClass}
      >
        {body}
      </div>
    </div>
  );
}
