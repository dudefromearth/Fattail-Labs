"use client";

// Course-hub intro player: poster + play until click, then 16:9 YouTube embed.
// Matches TrailerShell interaction; keeps the hub HTML light for crawlers
// (thumbnail + title always present; iframe only after interaction).

import { useState } from "react";

export default function HubIntroVideo({
  videoId,
  embedUrl,
  title,
}: {
  videoId: string;
  embedUrl: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const poster = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
        <iframe
          src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
          title={title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <button
          type="button"
          onClick={() => setPlaying(false)}
          aria-label="Close intro video"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play intro video: ${title}`}
      className="group relative block w-full overflow-hidden rounded-2xl bg-zinc-900 text-left shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        width={1280}
        height={720}
        className="aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/95 text-2xl text-white shadow-xl transition-transform group-hover:scale-110 sm:h-20 sm:w-20 sm:text-3xl">
          ▶
        </span>
      </span>
      <span className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
          Intro
        </span>
        <span className="mt-1 block text-base font-semibold text-white sm:text-lg">
          {title}
        </span>
      </span>
    </button>
  );
}
