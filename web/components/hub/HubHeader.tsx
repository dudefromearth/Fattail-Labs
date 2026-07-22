"use client";

import Link from "next/link";
import HubIntroVideo from "@/components/HubIntroVideo";
import type { HubPage } from "@/lib/hub";
import { youtubeEmbedUrl } from "@/lib/hub";
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
  const videoId =
    edit?.value("intro_video_id", hub.intro_video_id ?? "") ??
    hub.intro_video_id ??
    "";
  const videoTitle =
    edit?.value("intro_video_title", hub.intro_video_title ?? "") ??
    hub.intro_video_title ??
    "Intro";

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
            videoId={videoId}
            embedUrl={youtubeEmbedUrl(videoId)}
            title={videoTitle || "Intro"}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            {edit?.editMode
              ? "Set an intro video ID below"
              : "Intro video coming soon"}
          </div>
        )}
        {edit?.editMode ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              YouTube video ID or URL
              <input
                value={videoId}
                onChange={(e) =>
                  edit.setField("intro_video_id", e.target.value)
                }
                placeholder="izSfocWOB0E or https://youtube.com/watch?v=…"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Intro title (overlay)
              <input
                value={videoTitle}
                onChange={(e) =>
                  edit.setField("intro_video_title", e.target.value)
                }
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
          <Link href="/courses" className="text-emerald-600 hover:underline">
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
