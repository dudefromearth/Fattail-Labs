"use client";

import Link from "next/link";
import HubIntroVideo from "@/components/HubIntroVideo";
import type { HubPage } from "@/lib/hub";
import { parseYoutubeVideoId, youtubeEmbedUrl } from "@/lib/hub";
import { HubEditableMarkdown, HubEditableText } from "./HubEditable";
import { useHubEdit } from "./HubEditContext";

export default function HubHeader({
  hub,
  courseCount,
}: {
  hub: HubPage;
  courseCount: number;
}) {
  const edit = useHubEdit();
  const title = edit?.value("title", hub.title) ?? hub.title;
  const description =
    edit?.value("description_md", hub.description_md ?? "") ??
    hub.description_md ??
    "";
  const rawVideoId =
    edit?.value("intro_video_id", hub.intro_video_id ?? "") ??
    hub.intro_video_id ??
    "";
  const videoId = parseYoutubeVideoId(rawVideoId) ?? "";
  const videoTitle =
    edit?.value("intro_video_title", hub.intro_video_title ?? "") ??
    hub.intro_video_title ??
    "Intro";
  const videoError = edit?.fieldErrors["intro_video_id"] ?? null;

  return (
    <header>
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          FatTail Labs
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          <HubEditableText field="title" value={title} as="span" />
        </h1>
      </div>

      <div id="intro-video" className="mt-8">
        {videoId ? (
          <HubIntroVideo
            key={videoId}
            videoId={videoId}
            embedUrl={youtubeEmbedUrl(videoId)}
            title={videoTitle || "Intro"}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            {edit?.editMode
              ? rawVideoId.trim()
                ? "Could not parse that YouTube link — paste a watch URL or 11-character id"
                : "Set an intro video ID below"
              : "Intro video coming soon"}
          </div>
        )}
        {edit?.editMode ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              YouTube video ID or URL
              <input
                value={rawVideoId}
                onChange={(e) => {
                  edit.clearFieldError("intro_video_id");
                  edit.setField("intro_video_id", e.target.value);
                }}
                onBlur={(e) => {
                  const raw = e.target.value.trim();
                  const parsed = parseYoutubeVideoId(raw);
                  // Commit this field alone — never bundled with FAQs.
                  void edit.commitField(
                    "intro_video_id",
                    parsed ?? raw,
                  );
                }}
                placeholder="izSfocWOB0E or https://youtube.com/watch?v=…"
                className={`mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-zinc-700 ${
                  videoError
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-zinc-300"
                }`}
              />
              {videoError && (
                <span className="mt-1 block text-xs text-red-600" role="alert">
                  {videoError}
                </span>
              )}
              {!videoError && rawVideoId.trim() && !videoId && (
                <span className="mt-1 block text-xs text-red-600">
                  Not a valid YouTube id or URL
                </span>
              )}
              {!videoError && videoId && rawVideoId.trim() !== videoId && (
                <span className="mt-1 block text-xs text-emerald-600">
                  Saving as id: {videoId}
                </span>
              )}
            </label>
            <label className="text-xs text-zinc-500">
              Intro title (overlay)
              <input
                value={videoTitle}
                onChange={(e) =>
                  edit.setField("intro_video_title", e.target.value)
                }
                onBlur={(e) => {
                  void edit.commitField(
                    "intro_video_title",
                    e.target.value,
                  );
                }}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
              />
            </label>
          </div>
        ) : (
          videoId && (
            <p className="mt-2 text-sm text-zinc-500">
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                className="text-emerald-600 hover:underline"
                rel="noopener noreferrer"
              >
                Watch on YouTube
              </a>
              {videoTitle ? ` · ${videoTitle}` : ""}
            </p>
          )
        )}
      </div>

      <div className="mt-8 max-w-3xl">
        <div className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          <HubEditableMarkdown
            field="description_md"
            value={description}
          />
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          {courseCount} published courses · Free previews on every course page ·{" "}
          <Link href="/course" className="text-emerald-600 hover:underline">
            Interactive catalog
          </Link>
          {" · "}
          <Link href="/membership" className="text-emerald-600 hover:underline">
            Membership
          </Link>
        </p>
      </div>
    </header>
  );
}
