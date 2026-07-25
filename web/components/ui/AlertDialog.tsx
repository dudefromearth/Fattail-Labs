"use client";

import { useEffect, useId, useRef } from "react";
import Button from "./Button";
import { IconExclamation } from "./icons";

export type AlertDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * HIG-style modal alert. Replaces window.confirm / window.alert for product UI.
 */
export default function AlertDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-hidden
        onClick={() => !busy && onCancel()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-6 shadow-[var(--elevation-3)]"
      >
        <div className="flex gap-3">
          {destructive && (
            <span className="mt-0.5 text-[var(--color-destructive)]">
              <IconExclamation size={22} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[length:var(--text-headline)] font-semibold text-[var(--color-label)]"
            >
              {title}
            </h2>
            <p
              id={descId}
              className="mt-2 whitespace-pre-line text-sm text-[var(--color-label-secondary)]"
            >
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {cancelLabel != null && cancelLabel !== "" && (
            <Button
              ref={cancelRef}
              variant="secondary"
              onClick={onCancel}
              disabled={busy}
              className="sm:min-w-[7rem]"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            ref={cancelLabel ? undefined : cancelRef}
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
            disabled={busy}
            className="sm:min-w-[7rem]"
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
