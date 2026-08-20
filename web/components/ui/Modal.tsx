"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
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
};

/**
 * HI Spec Modal — scrim, focus trap, Esc cancels, IconButton xmark close.
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
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("[data-modal-close]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;

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
        className={
          "relative flex max-h-[85vh] flex-col overflow-hidden " +
          "rounded-[var(--radius-lg)] bg-[var(--color-surface)] " +
          "text-[var(--color-label)] shadow-[var(--elevation-3)] " +
          widthClass
        }
      >
        <div className="flex min-h-[var(--hit-min)] items-center gap-2 border-b border-[var(--color-separator)] px-4">
          <IconButton
            label="Close"
            data-modal-close
            onClick={onClose}
          >
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
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-3 border-t border-[var(--color-separator)] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
