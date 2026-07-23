"use client";

// Progress-tracking player (Progress Tracking spec §4 + Phase F signed CDN):
// - youtube: IFrame API resume + sample while PLAYING
// - bunny: signed embed iframe; wall-clock samples while tab is visible

import { useCallback, useEffect, useRef, useState } from "react";
import { emitProgress } from "@/lib/progressEvents";

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLIFrameElement, opts: object) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  getCurrentTime: () => number;
  getPlayerState: () => number;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
};

const REPORT_EVERY = 15; // seconds of accumulated watch time
const SAMPLE_EVERY = 5; // seconds

export default function LessonPlayer({
  courseSlug,
  lessonSlug,
  embedUrl,
  provider = "youtube",
  title,
  duration,
  initialPosition,
  initialCompleted,
  expiresAt,
}: {
  courseSlug: string;
  lessonSlug: string;
  embedUrl: string;
  provider?: string;
  title: string;
  duration: number;
  initialPosition: number;
  initialCompleted: boolean;
  expiresAt?: number | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const unsentRef = useRef(0);
  const positionRef = useRef(initialPosition);
  const [completed, setCompleted] = useState(initialCompleted);

  const send = useCallback(
    (opts?: { keepalive?: boolean }) => {
      const delta = Math.round(unsentRef.current);
      const position = Math.round(positionRef.current);
      if (delta <= 0 && position <= 0) return;
      unsentRef.current = 0;
      fetch("/api/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        keepalive: opts?.keepalive ?? false,
        body: JSON.stringify({
          course_slug: courseSlug,
          lesson_slug: lessonSlug,
          position,
          watched_delta: delta,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.completed) {
            setCompleted(true);
            emitProgress({
              courseSlug,
              lessonSlug,
              completed: true,
            });
          }
        })
        .catch(() => {
          unsentRef.current += delta;
        });
    },
    [courseSlug, lessonSlug],
  );

  // YouTube path
  useEffect(() => {
    if (provider !== "youtube") return;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    function attach() {
      if (cancelled || !iframeRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            const p = playerRef.current;
            if (
              p &&
              initialPosition > 10 &&
              duration > 0 &&
              initialPosition < duration * 0.95
            ) {
              p.seekTo(initialPosition, true);
            }
          },
          onStateChange: (e: { data: number }) => {
            const YTS = window.YT!.PlayerState;
            if (e.data === YTS.PAUSED) send();
            if (e.data === YTS.ENDED) {
              positionRef.current = duration;
              unsentRef.current += SAMPLE_EVERY;
              send();
            }
          },
        },
      });
      interval = setInterval(() => {
        const p = playerRef.current;
        if (!p || !window.YT) return;
        try {
          if (p.getPlayerState() === window.YT.PlayerState.PLAYING) {
            positionRef.current = p.getCurrentTime();
            unsentRef.current += SAMPLE_EVERY;
            if (unsentRef.current >= REPORT_EVERY) send();
          }
        } catch {
          /* player not ready yet */
        }
      }, SAMPLE_EVERY * 1000);
    }

    if (window.YT?.Player) {
      attach();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        attach();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    const onLeave = () => send({ keepalive: true });
    window.addEventListener("pagehide", onLeave);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      window.removeEventListener("pagehide", onLeave);
      send({ keepalive: true });
    };
  }, [send, initialPosition, duration, provider]);

  // Bunny (signed CDN) path — heartbeat while document is visible
  useEffect(() => {
    if (provider !== "bunny") return;
    let interval: ReturnType<typeof setInterval> | null = null;
    positionRef.current = initialPosition;

    interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      positionRef.current += SAMPLE_EVERY;
      unsentRef.current += SAMPLE_EVERY;
      if (unsentRef.current >= REPORT_EVERY) send();
    }, SAMPLE_EVERY * 1000);

    const onLeave = () => send({ keepalive: true });
    window.addEventListener("pagehide", onLeave);
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("pagehide", onLeave);
      send({ keepalive: true });
    };
  }, [send, initialPosition, provider]);

  async function markComplete() {
    const res = await fetch("/api/progress/complete", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_slug: courseSlug, lesson_slug: lessonSlug }),
    });
    if (res.ok) {
      setCompleted(true);
      emitProgress({ courseSlug, lessonSlug, completed: true });
    }
  }

  const expiringSoon =
    provider === "bunny" &&
    typeof expiresAt === "number" &&
    expiresAt * 1000 - Date.now() < 5 * 60 * 1000;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-black">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          // Bunny embed needs fullscreen + autoplay capabilities
          referrerPolicy="origin"
        />
      </div>
      {provider === "bunny" && expiringSoon && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Secure playback link expires soon — refresh the page if video stops.
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        {completed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            ✓ Completed
          </span>
        ) : (
          <button
            onClick={markComplete}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700"
          >
            Mark complete
          </button>
        )}
        {initialPosition > 10 && !completed && provider === "youtube" && (
          <span className="text-xs text-zinc-500">
            Resuming from {Math.floor(initialPosition / 60)}:
            {String(Math.floor(initialPosition % 60)).padStart(2, "0")}
          </span>
        )}
        {provider === "bunny" && (
          <span className="text-xs text-zinc-500">Secure stream</span>
        )}
      </div>
    </div>
  );
}
