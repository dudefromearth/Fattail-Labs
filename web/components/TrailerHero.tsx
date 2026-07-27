"use client";

// Hero trailer (Course Trailer Spec v1.0): centered play button over the hero;
// clicking swaps the hero for a TRUE 16:9 player sized to show the full video,
// ✕ restores the hero. Also hosts the edit-mode Trailer field (lower panel).

import { useEffect, useState } from "react";
import { useEdit } from "@/components/edit/EditContext";

export function TrailerShell({
  trailer,
  title,
  children,
}: {
  trailer: { provider: string; embed_url: string } | null;
  title: string;
  children: React.ReactNode;
}) {
  const edit = useEdit();
  const [playing, setPlaying] = useState(false);

  if (playing && trailer) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-black">
        <iframe
          src={`${trailer.embed_url}&autoplay=1`}
          title={`${title} — trailer`}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <button
          type="button"
          onClick={() => setPlaying(false)}
          aria-label="Close trailer"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white">
      {children}
      {/* Full-bleed play is for members only — in edit mode the lower panel
          (trailer URL, hero upload) must stay clickable. */}
      {trailer && !edit?.editMode && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play trailer for ${title}`}
          className="group absolute inset-0 z-10 flex items-center justify-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/90 text-3xl text-white shadow-xl transition-transform group-hover:scale-110">
            ▶
          </span>
        </button>
      )}
    </div>
  );
}

/** Trailer YouTube field — lives in the banner's lower stats panel (edit mode). */
export function TrailerEditChip() {
  const edit = useEdit();
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (edit?.editMode && draft === null && edit.trailerVideoId !== undefined) {
      setDraft(edit.trailerVideoId ?? "");
    }
  }, [edit?.editMode, edit?.trailerVideoId, draft]);

  if (!edit?.editMode) return null;

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-white/90 sm:flex-row sm:items-center sm:gap-2">
      <span className="shrink-0 font-medium text-white">Trailer</span>
      <input
        value={draft ?? ""}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null)
            void edit.commitField("course.trailer_video_id", draft);
        }}
        placeholder="YouTube URL or ID (empty = none)"
        className="min-w-0 w-full flex-1 rounded-lg bg-black/40 px-2.5 py-1.5 outline-none ring-1 ring-emerald-400/60 placeholder:text-zinc-400 sm:max-w-md"
      />
    </label>
  );
}

/** Lower-panel row: trailer URL + hero upload (edit mode only). */
export function BannerMediaRow({
  heroSlot,
}: {
  heroSlot?: React.ReactNode;
}) {
  const edit = useEdit();
  if (!edit?.editMode) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-white/15 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
      <TrailerEditChip />
      {heroSlot}
    </div>
  );
}
