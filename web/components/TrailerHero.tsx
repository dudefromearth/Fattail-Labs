"use client";

// Hero trailer (Course Trailer Spec v1.0): centered play button over the hero;
// clicking swaps the hero area for the trailer player in place. Also hosts the
// edit-mode Trailer chip (paste URL/ID; server normalizes).

import { useEffect, useState } from "react";
import { useEdit } from "@/components/edit/EditContext";

export function TrailerPlayButton({
  trailer,
  title,
}: {
  trailer: { provider: string; embed_url: string } | null;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!trailer) return null;

  if (!playing) {
    return (
      <button
        onClick={() => setPlaying(true)}
        aria-label={`Play trailer for ${title}`}
        className="group absolute inset-0 z-10 flex items-center justify-center"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/90 text-3xl text-white shadow-xl transition-transform group-hover:scale-110">
          ▶
        </span>
      </button>
    );
  }

  return (
    <div className="absolute inset-0 z-20 bg-black">
      <iframe
        src={`${trailer.embed_url}&autoplay=1`}
        title={`${title} — trailer`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <button
        onClick={() => setPlaying(false)}
        aria-label="Close trailer"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
      >
        ✕
      </button>
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
