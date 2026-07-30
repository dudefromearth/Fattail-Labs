"use client";

/**
 * Spec v0.6 §1.4 — session header image area:
 * thumbnail strip · drop target · click-to-upload · lightbox + caption.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listJournalAttachments,
  MAX_JOURNAL_ATTACHMENTS,
  patchJournalAttachmentCaption,
  uploadJournalAttachment,
  type JournalAttachment,
} from "@/lib/journalSessionApi";
import { Button } from "@/components/ui";

type Props = {
  sessionId: number;
  disabled?: boolean;
  onError?: (msg: string | null) => void;
};

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export default function SessionMediaHeader({
  sessionId,
  disabled = false,
  onError,
}: Props) {
  const [items, setItems] = useState<JournalAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxIx, setLightboxIx] = useState<number | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionBusy, setCaptionBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const rows = await listJournalAttachments(sessionId);
      setItems(rows);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not load images");
    }
  }, [sessionId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled || busy) return;
      const list = Array.from(files).filter((f) => IMAGE_TYPES.has(f.type));
      if (list.length === 0) {
        onError?.("Only images are accepted.");
        return;
      }
      const room = MAX_JOURNAL_ATTACHMENTS - items.length;
      if (list.length > room) {
        onError?.(
          `That would add ${list.length} images but only ${room} slot${room === 1 ? "" : "s"} remain (max ${MAX_JOURNAL_ATTACHMENTS}). Drop refused.`,
        );
        return;
      }
      setBusy(true);
      onError?.(null);
      try {
        for (const f of list) {
          await uploadJournalAttachment(sessionId, f);
        }
        await load();
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [disabled, busy, items.length, sessionId, load, onError],
  );

  // Paste-from-composer path (SessionInterviewChat dispatches this)
  useEffect(() => {
    function onPasteImages(e: Event) {
      const ce = e as CustomEvent<{ sessionId: number; files: File[] }>;
      if (ce.detail?.sessionId !== sessionId) return;
      if (ce.detail.files?.length) void uploadFiles(ce.detail.files);
    }
    window.addEventListener("journal-paste-images", onPasteImages);
    return () =>
      window.removeEventListener("journal-paste-images", onPasteImages);
  }, [sessionId, uploadFiles]);

  function openLightbox(ix: number) {
    setLightboxIx(ix);
    setCaptionDraft(items[ix]?.caption_md || "");
  }

  async function saveCaption() {
    if (lightboxIx == null || disabled) return;
    const att = items[lightboxIx];
    if (!att) return;
    setCaptionBusy(true);
    onError?.(null);
    try {
      const updated = await patchJournalAttachmentCaption(
        sessionId,
        att.id,
        captionDraft,
      );
      setItems((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not save caption");
    } finally {
      setCaptionBusy(false);
    }
  }

  const lightbox = lightboxIx != null ? items[lightboxIx] : null;

  return (
    <div
      className={[
        "rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/30 p-2",
        dragOver && !disabled ? "border-[var(--color-tint)] bg-[var(--color-tint-soft)]" : "",
      ].join(" ")}
      data-testid="journal-media-header"
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        if (e.dataTransfer.files?.length) {
          void uploadFiles(e.dataTransfer.files);
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {items.map((a, ix) => (
          <button
            key={a.id}
            type="button"
            className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-separator)] bg-[var(--color-surface)]"
            onClick={() => openLightbox(ix)}
            data-testid={`journal-media-thumb-${a.id}`}
            aria-label="Open image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.download_path}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ))}
        {!disabled && (
          <button
            type="button"
            className="flex h-14 min-w-[3.5rem] flex-1 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--color-separator)] text-xs text-[var(--color-label-tertiary)] hover:bg-[var(--color-fill)] disabled:opacity-40"
            disabled={busy || items.length >= MAX_JOURNAL_ATTACHMENTS}
            onClick={() => fileRef.current?.click()}
            data-testid="journal-media-upload"
          >
            {busy ? "…" : items.length === 0 ? "Drop or click to add images" : "+"}
          </button>
        )}
        {disabled && items.length === 0 && (
          <span className="px-2 text-xs text-[var(--color-label-tertiary)]">
            No images
          </span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {lightbox && lightboxIx != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image"
          data-testid="journal-media-lightbox"
          onClick={() => setLightboxIx(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.download_path}
              alt=""
              className="max-h-[50vh] w-full rounded object-contain"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="text-xs text-[var(--color-tint)] disabled:opacity-40"
                disabled={lightboxIx <= 0}
                onClick={() => openLightbox(lightboxIx - 1)}
              >
                Previous
              </button>
              <span className="text-xs text-[var(--color-label-tertiary)]">
                {lightboxIx + 1} / {items.length}
              </span>
              <button
                type="button"
                className="text-xs text-[var(--color-tint)] disabled:opacity-40"
                disabled={lightboxIx >= items.length - 1}
                onClick={() => openLightbox(lightboxIx + 1)}
              >
                Next
              </button>
            </div>
            <label className="block text-xs font-medium text-[var(--color-label)]">
              Caption
              <textarea
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                rows={2}
                disabled={disabled || captionBusy}
                className="mt-1 w-full rounded border border-[var(--color-separator)] px-2 py-1.5 text-sm"
                data-testid="journal-media-caption"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLightboxIx(null)}
              >
                Close
              </Button>
              {!disabled && (
                <Button
                  type="button"
                  variant="primary"
                  disabled={captionBusy}
                  onClick={() => void saveCaption()}
                  data-testid="journal-media-caption-save"
                >
                  {captionBusy ? "Saving…" : "Save caption"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
