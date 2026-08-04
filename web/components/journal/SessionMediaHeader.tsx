"use client";

/**
 * Spec v0.6 §1.4 — session header image area:
 * thumbnail strip · drop target · click-to-upload · lightbox + caption.
 * Empty journals show this by default; first drop/paste may create a session.
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
  /** Null on empty day — first upload/paste creates a session via ensureSession. */
  sessionId: number | null;
  disabled?: boolean;
  onError?: (msg: string | null) => void;
  /** Create (or return) an open session before the first attachment. */
  ensureSession?: () => Promise<number>;
};

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function isImageClipboardType(type: string): boolean {
  if (IMAGE_TYPES.has(type)) return true;
  if (type.startsWith("image/")) return true;
  // Some browsers expose clipboard files as generic binary.
  return type === "Files";
}

export default function SessionMediaHeader({
  sessionId,
  disabled = false,
  onError,
  ensureSession,
}: Props) {
  const [items, setItems] = useState<JournalAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const [lightboxIx, setLightboxIx] = useState<number | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionBusy, setCaptionBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Local id so uploads continue if parent flips null → number mid-flight. */
  const resolvedIdRef = useRef<number | null>(sessionId);

  useEffect(() => {
    resolvedIdRef.current = sessionId;
  }, [sessionId]);

  const load = useCallback(async (id: number) => {
    try {
      const rows = await listJournalAttachments(id);
      setItems(rows);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not load images");
    }
  }, [onError]);

  useEffect(() => {
    if (sessionId == null) {
      setItems([]);
      return;
    }
    void load(sessionId);
  }, [sessionId, load]);

  const resolveSessionId = useCallback(async (): Promise<number | null> => {
    if (resolvedIdRef.current != null) return resolvedIdRef.current;
    if (!ensureSession) {
      onError?.("Start writing or drop an image to open a journal entry first.");
      return null;
    }
    const id = await ensureSession();
    resolvedIdRef.current = id;
    return id;
  }, [ensureSession, onError]);

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
        const id = await resolveSessionId();
        if (id == null) return;
        for (const f of list) {
          await uploadJournalAttachment(id, f);
        }
        await load(id);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [disabled, busy, items.length, resolveSessionId, load, onError],
  );

  // Paste-from-composer path (SessionInterviewChat dispatches this)
  useEffect(() => {
    function onPasteImages(e: Event) {
      const ce = e as CustomEvent<{ sessionId: number; files: File[] }>;
      if (sessionId != null && ce.detail?.sessionId !== sessionId) return;
      // Empty-day media zone has no session yet — still accept paste events
      // that target this open day when sessionId is null (only one empty zone).
      if (sessionId == null && ce.detail?.sessionId != null) return;
      if (ce.detail.files?.length) void uploadFiles(ce.detail.files);
    }
    window.addEventListener("journal-paste-images", onPasteImages);
    return () =>
      window.removeEventListener("journal-paste-images", onPasteImages);
  }, [sessionId, uploadFiles]);

  async function peekClipboardForImages(): Promise<boolean> {
    try {
      const nav = navigator as Navigator & {
        clipboard?: Clipboard & {
          read?: () => Promise<ClipboardItem[]>;
        };
      };
      if (!nav.clipboard?.read) return false;
      const items = await nav.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (isImageClipboardType(type)) return true;
        }
      }
      return false;
    } catch {
      // Permission denied, empty clipboard, or unsupported browser.
      return false;
    }
  }

  async function onZoneEnter() {
    if (disabled) return;
    const has = await peekClipboardForImages();
    setPasteHint(has);
  }

  function onZoneLeave() {
    setDragOver(false);
    setPasteHint(false);
  }

  function openLightbox(ix: number) {
    setLightboxIx(ix);
    setCaptionDraft(items[ix]?.caption_md || "");
  }

  async function saveCaption() {
    if (lightboxIx == null || disabled) return;
    const att = items[lightboxIx];
    const id = resolvedIdRef.current ?? sessionId;
    if (!att || id == null) return;
    setCaptionBusy(true);
    onError?.(null);
    try {
      const updated = await patchJournalAttachmentCaption(
        id,
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
  const canAdd = !disabled && items.length < MAX_JOURNAL_ATTACHMENTS;

  return (
    <div
      className={[
        "rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/30 p-2 outline-none",
        dragOver && !disabled
          ? "border-[var(--color-tint)] bg-[var(--color-tint-soft)]"
          : "",
        !disabled ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]" : "",
      ].join(" ")}
      data-testid="journal-media-header"
      tabIndex={disabled ? -1 : 0}
      role="region"
      aria-label="Journal images — drop, click, or paste to upload"
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
      onMouseEnter={() => void onZoneEnter()}
      onMouseLeave={onZoneLeave}
      onFocus={() => void onZoneEnter()}
      onBlur={() => setPasteHint(false)}
      onPaste={(e) => {
        if (disabled) return;
        const files = e.clipboardData?.files;
        if (files && files.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          void uploadFiles(files);
          setPasteHint(false);
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
            disabled={busy || !canAdd}
            onClick={() => fileRef.current?.click()}
            data-testid="journal-media-upload"
          >
            {busy
              ? "…"
              : items.length === 0
                ? "Drop or click to add images"
                : "+"}
          </button>
        )}
        {disabled && items.length === 0 && (
          <span className="px-2 text-xs text-[var(--color-label-tertiary)]">
            No images
          </span>
        )}
      </div>

      {pasteHint && !disabled && canAdd && (
        <p
          className="mt-2 text-center text-xs font-medium text-[var(--color-tint)]"
          data-testid="journal-media-paste-hint"
          role="status"
        >
          Image in clipboard — press ⌘V / Ctrl+V to paste and upload
        </p>
      )}

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
