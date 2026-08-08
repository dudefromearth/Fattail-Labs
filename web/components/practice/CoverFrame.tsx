"use client";

/**
 * Shared 16:9 cover frame — library cards (Playbook · Campaigns).
 * Controls are discrete: visible on hover / keyboard focus only (YouTube banner pattern).
 */

import { useRef, useState } from "react";

type Props = {
  /** Unique for test ids */
  testId: string;
  imageUrl: string | null;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => Promise<void>;
  className?: string;
  /** Optional empty-state label under hover control */
  emptyHint?: string;
};

export default function CoverFrame({
  testId,
  imageUrl,
  disabled = false,
  onUpload,
  onClear,
  className = "",
  emptyHint = "Add cover",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bust, setBust] = useState(0);
  const hasCover = !!imageUrl;

  async function handleFile(file: File | undefined) {
    if (!file || busy || disabled) return;
    if (!file.type.startsWith("image/")) {
      setErr("Choose an image (JPEG, PNG, WebP, …).");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onUpload(file);
      setBust((n) => n + 1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not set cover");
    } finally {
      setBusy(false);
    }
  }

  async function handleClear(e: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || disabled || !hasCover || !onClear) return;
    setBusy(true);
    setErr(null);
    try {
      await onClear();
      setBust((n) => n + 1);
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Could not remove cover");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className} data-testid={testId}>
      <div
        className="group relative aspect-video w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]"
      >
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element -- session-auth media
          <img
            src={`${imageUrl}?v=${bust}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[var(--color-fill)] to-[var(--color-separator)]/40" />
        )}

        {/* Hover / focus controls only */}
        <div
          className={
            "absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/55 via-transparent to-transparent pb-2 " +
            "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 " +
            "pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
          }
        >
          <button
            type="button"
            disabled={busy || disabled}
            data-testid={`${testId}-upload`}
            className="pointer-events-auto rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm disabled:opacity-50 dark:bg-zinc-900/95 dark:text-zinc-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              inputRef.current?.click();
            }}
            aria-label={hasCover ? "Change cover image" : "Upload cover image"}
          >
            {busy
              ? "Working…"
              : hasCover
                ? "Change cover"
                : emptyHint}
          </button>
        </div>

        {hasCover && onClear && (
          <button
            type="button"
            disabled={busy || disabled}
            data-testid={`${testId}-clear`}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 disabled:opacity-40"
            onClick={handleClear}
            aria-label="Remove cover image"
          >
            Remove
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void handleFile(f);
          }}
        />
      </div>
      {err && (
        <p className="mt-1 text-[10px] text-red-600" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}

