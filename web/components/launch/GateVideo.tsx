"use client";

// Intro video on feature-gate landings (home countdown, etc.).
// YouTube → click-to-play poster; other https URLs → direct iframe embed.

import HubIntroVideo from "@/components/HubIntroVideo";
import { parseYoutubeVideoId, youtubeEmbedUrl } from "@/lib/hub";

export default function GateVideo({
  url,
  title = "Intro video",
}: {
  url: string;
  title?: string;
}) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytId = parseYoutubeVideoId(trimmed);
  if (ytId) {
    return (
      <div className="mx-auto mt-8 w-full max-w-2xl text-left" data-testid="gate-video">
        <HubIntroVideo
          videoId={ytId}
          embedUrl={youtubeEmbedUrl(ytId)}
          title={title}
        />
      </div>
    );
  }

  if (!/^https?:\/\//i.test(trimmed)) return null;

  return (
    <div
      className="mx-auto mt-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-white/15"
      data-testid="gate-video"
    >
      <iframe
        src={trimmed}
        title={title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
