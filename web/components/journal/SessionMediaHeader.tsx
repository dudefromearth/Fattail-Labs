"use client";

/**
 * Spec v0.6 §1.4 — session header image area:
 * thumbnail strip · drop target · click-to-upload · lightbox + caption.
 * Empty journals show this by default; first drop/paste may create a session.
 *
 * Paste hint: brief, non-blocking, only over the upload slot; suppressed after
 * a paste until the member copies again.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteJournalAttachment,
  listJournalAttachments,
  MAX_JOURNAL_ATTACHMENTS,
  patchJournalAttachmentCaption,
  uploadJournalAttachment,
  type JournalAttachment,
} from "@/lib/journalSessionApi";
import { Button } from "@/components/ui";
import { IconCollapse, IconExpand } from "@/components/ui/icons";

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const [lightboxIx, setLightboxIx] = useState<number | null>(null);
  const [lightboxExpanded, setLightboxExpanded] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionBusy, setCaptionBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** After paste, hide hint until a new copy event. */
  const suppressHintUntilCopyRef = useRef(false);
  /** Local id so uploads continue if parent flips null → number mid-flight. */
  const resolvedIdRef = useRef<number | null>(sessionId);

  useEffect(() => {
    resolvedIdRef.current = sessionId;
  }, [sessionId]);

  // New system copy/cut re-enables the paste tip for the next image.
  useEffect(() => {
    function onCopyOrCut() {
      suppressHintUntilCopyRef.current = false;
    }
    window.addEventListener("copy", onCopyOrCut);
    window.addEventListener("cut", onCopyOrCut);
    return () => {
      window.removeEventListener("copy", onCopyOrCut);
      window.removeEventListener("cut", onCopyOrCut);
    };
  }, []);

  const load = useCallback(
    async (id: number) => {
      try {
        const rows = await listJournalAttachments(id);
        setItems(rows);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Could not load images");
      }
    },
    [onError],
  );

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

  const dismissPasteHintAfterUse = useCallback(() => {
    setPasteHint(false);
    suppressHintUntilCopyRef.current = true;
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[], opts?: { fromPaste?: boolean }) => {
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
      if (opts?.fromPaste) dismissPasteHintAfterUse();
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
    [
      disabled,
      busy,
      items.length,
      resolveSessionId,
      load,
      onError,
      dismissPasteHintAfterUse,
    ],
  );

  // Paste-from-composer path (SessionInterviewChat dispatches this)
  useEffect(() => {
    function onPasteImages(e: Event) {
      const ce = e as CustomEvent<{ sessionId: number; files: File[] }>;
      if (sessionId != null && ce.detail?.sessionId !== sessionId) return;
      if (sessionId == null && ce.detail?.sessionId != null) return;
      if (ce.detail.files?.length) {
        void uploadFiles(ce.detail.files, { fromPaste: true });
      }
    }
    window.addEventListener("journal-paste-images", onPasteImages);
    return () =>
      window.removeEventListener("journal-paste-images", onPasteImages);
  }, [sessionId, uploadFiles]);

  useEffect(() => {
    function onOpenAttach() {
      if (disabled) return;
      fileRef.current?.click();
    }
    window.addEventListener("journal-open-attach", onOpenAttach);
    return () => window.removeEventListener("journal-open-attach", onOpenAttach);
  }, [disabled]);

  async function peekClipboardForImages(): Promise<boolean> {
    try {
      const nav = navigator as Navigator & {
        clipboard?: Clipboard & {
          read?: () => Promise<ClipboardItem[]>;
        };
      };
      if (!nav.clipboard?.read) return false;
      const clipItems = await nav.clipboard.read();
      for (const item of clipItems) {
        for (const type of item.types) {
          if (isImageClipboardType(type)) return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /** Only the upload slot peeks the clipboard — never the thumbnails. */
  async function onUploadSlotEnter() {
    if (disabled || suppressHintUntilCopyRef.current) {
      setPasteHint(false);
      return;
    }
    const has = await peekClipboardForImages();
    if (suppressHintUntilCopyRef.current) {
      setPasteHint(false);
      return;
    }
    setPasteHint(has);
  }

  function onUploadSlotLeave() {
    setPasteHint(false);
  }

  function openLightbox(ix: number) {
    setLightboxIx(ix);
    setLightboxExpanded(false);
    setCaptionDraft(items[ix]?.caption_md || "");
  }

  function closeLightbox() {
    setLightboxIx(null);
    setLightboxExpanded(false);
  }

  async function removeAttachment(attId: number) {
    if (disabled || busy || deletingId != null) return;
    const id = resolvedIdRef.current ?? sessionId;
    if (id == null) return;
    setDeletingId(attId);
    onError?.(null);
    try {
      await deleteJournalAttachment(id, attId);
      setItems((prev) => prev.filter((a) => a.id !== attId));
      setLightboxIx((cur) => {
        if (cur == null) return null;
        const remaining = items.filter((a) => a.id !== attId);
        if (remaining.length === 0) return null;
        return Math.min(cur, remaining.length - 1);
      });
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not delete image");
    } finally {
      setDeletingId(null);
    }
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
        "w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/30 p-2 outline-none",
        dragOver && !disabled
          ? "border-[var(--color-tint)] bg-[var(--color-tint-soft)]"
          : "",
        !disabled
          ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
          : "",
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
      onPaste={(e) => {
        if (disabled) return;
        const files = e.clipboardData?.files;
        if (files && files.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          void uploadFiles(files, { fromPaste: true });
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {items.map((a, ix) => (
          <div
            key={a.id}
            className="relative h-14 w-14 shrink-0"
            data-testid={`journal-media-thumb-wrap-${a.id}`}
          >
            <button
              type="button"
              className="h-full w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-separator)] bg-[var(--color-surface)]"
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
            {!disabled && (
              <button
                type="button"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] text-[11px] font-semibold leading-none text-[var(--color-label-secondary)] shadow-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 disabled:opacity-40"
                aria-label="Delete image"
                title="Remove image"
                disabled={busy || deletingId === a.id}
                data-testid={`journal-media-delete-${a.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void removeAttachment(a.id);
                }}
              >
                {deletingId === a.id ? "…" : "×"}
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <div
            className="relative min-w-[3.5rem] flex-1"
            onMouseEnter={() => void onUploadSlotEnter()}
            onMouseLeave={onUploadSlotLeave}
          >
            <button
              type="button"
              className="flex h-14 w-full min-w-[3.5rem] items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--color-separator)] text-xs text-[var(--color-label-tertiary)] hover:bg-[var(--color-fill)] disabled:opacity-40"
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
            {/* Non-blocking tip — only on the upload slot, pointer-events none */}
            {pasteHint && canAdd && (
              <p
                className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[14rem] -translate-x-1/2 rounded bg-[var(--color-label)] px-2 py-1 text-center text-[10px] font-medium leading-snug text-[var(--color-surface)] shadow-md"
                data-testid="journal-media-paste-hint"
                role="status"
              >
                Press ⌘V / Ctrl+V to paste
              </p>
            )}
          </div>
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
          className={[
            "fixed inset-0 z-50 flex items-center justify-center",
            lightboxExpanded ? "bg-black/90 p-2 sm:p-4" : "bg-black/50 p-4",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label={lightboxExpanded ? "Expanded image" : "Image"}
          data-testid="journal-media-lightbox"
          data-expanded={lightboxExpanded ? "true" : "false"}
          onClick={closeLightbox}
        >
          <div
            className={[
              "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]",
              lightboxExpanded
                ? "h-full max-h-[100dvh] w-full max-w-[100vw] p-3 sm:p-4"
                : "max-h-[90vh] w-full max-w-lg p-4",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={[
                "relative min-h-0 flex-1 overflow-hidden rounded bg-black/5 dark:bg-black/30",
                lightboxExpanded ? "flex items-center justify-center" : "",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.download_path}
                alt=""
                className={[
                  "w-full rounded object-contain",
                  lightboxExpanded
                    ? "max-h-[calc(100dvh-12rem)] max-w-full"
                    : "max-h-[50vh]",
                ].join(" ")}
              />
              <button
                type="button"
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={lightboxExpanded ? "Exit expanded view" : "Expand image"}
                title={lightboxExpanded ? "Exit expanded view" : "Expand image"}
                data-testid="journal-media-lightbox-expand"
                onClick={() => setLightboxExpanded((v) => !v)}
              >
                {lightboxExpanded ? (
                  <IconCollapse size={18} />
                ) : (
                  <IconExpand size={18} />
                )}
              </button>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2">
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
            {!lightboxExpanded && (
              <label className="block shrink-0 text-xs font-medium text-[var(--color-label)]">
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
            )}
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {!disabled && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || deletingId === lightbox.id}
                  onClick={() => void removeAttachment(lightbox.id)}
                  data-testid="journal-media-lightbox-delete"
                >
                  {deletingId === lightbox.id ? "Removing…" : "Remove"}
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={closeLightbox}
              >
                Close
              </Button>
              {!disabled && !lightboxExpanded && (
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
