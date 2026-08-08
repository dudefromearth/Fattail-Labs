"use client";

/**
 * Direct cover control — click the 16:9 frame to upload/change the image.
 * No archive detour: POST /cover sets cover_attachment_id in one step.
 */

import { useRef, useState } from "react";
import {
  clearPlaybookCover,
  playbookCoverUrl,
  uploadPlaybookCover,
  type PlaybookEntry,
} from "@/lib/practiceSpineApi";

type Props = {
  bookId: number;
  coverAttachmentId?: number | null;
  /** Called with updated entry after upload/clear */
  onChange?: (entry: PlaybookEntry) => void;
  /** Larger frame on book page */
  size?: "card" | "banner";
  className?: string;
  disabled?: boolean;
};

export default function PlaybookCover({
  bookId,
  coverAttachmentId,
  onChange,
  size = "card",
  className = "",
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bust, setBust] = useState(0);

  const url = playbookCoverUrl(bookId, coverAttachmentId);
  const hasCover = !!url;

  async function onFile(file: File | undefined) {
    if (!file || busy || disabled) return;
    if (!file.type.startsWith("image/")) {
      setErr("Choose an image file (JPEG, PNG, WebP, …).");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const out = await uploadPlaybookCover(bookId, file);
      setBust((n) => n + 1);
      onChange?.(out.entry);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not set cover");
    } finally {
      setBusy(false);
    }
  }

  async function onClear(e: { preventDefault: () => void; stopPropagation: () => void }) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || disabled || !hasCover) return;
    setBusy(true);
    setErr(null);
    try {
      const entry = await clearPlaybookCover(bookId);
      setBust((n) => n + 1);
      onChange?.(entry);
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Could not remove cover");
    } finally {
      setBusy(false);
    }
  }

  const frame =
    size === "banner"
      ? "aspect-video w-full max-w-md"
      : "aspect-video w-full";

  return (
    <div className={className} data-testid={`playbook-cover-${bookId}`}>
      <div
        className={`group relative ${frame} overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]`}
      >
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element -- session-auth media URL
          <img
            src={`${url}?v=${bust}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center">
            <span className="text-xs font-medium text-[var(--color-label-tertiary)]">
              {busy ? "Uploading…" : "Add cover image"}
            </span>
            <span className="text-[10px] text-[var(--color-label-tertiary)]">
              16:9 · click to upload
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={busy || disabled}
          data-testid={`playbook-cover-upload-${bookId}`}
          className={
            "absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 via-transparent to-transparent pb-2 opacity-0 transition-opacity " +
            "focus-visible:opacity-100 group-hover:opacity-100 disabled:pointer-events-none " +
            (hasCover ? "" : "opacity-100")
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            inputRef.current?.click();
          }}
          aria-label={hasCover ? "Change cover image" : "Upload cover image"}
        >
          <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm dark:bg-zinc-900/95 dark:text-zinc-100">
            {busy ? "Working…" : hasCover ? "Change cover" : "Upload cover"}
          </span>
        </button>

        {hasCover && (
          <button
            type="button"
            disabled={busy || disabled}
            data-testid={`playbook-cover-clear-${bookId}`}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
            onClick={onClear}
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
            void onFile(f);
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
