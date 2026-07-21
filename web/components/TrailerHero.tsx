"use client";

// Hero trailer (Course Trailer Spec v1.0): centered play button over the hero;
// clicking swaps the hero for a TRUE 16:9 player sized to show the full video,
// ✕ restores the hero. Also hosts the edit-mode Trailer chip.

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
      {trailer && (
        <button
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
    <label className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur">
      <span className="font-medium">Trailer</span>
      <input
        value={draft ?? ""}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) edit.setField("course.trailer_video_id", draft);
        }}
        placeholder="YouTube URL or ID (empty = none)"
        className="w-64 rounded bg-white/10 px-2 py-1 outline-none ring-1 ring-emerald-400/60 placeholder:text-zinc-400"
      />
    </label>
  );
}
