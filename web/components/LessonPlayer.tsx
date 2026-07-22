"use client";

// Progress-tracking player (Progress Tracking spec §4): wraps the server-built
// YouTube iframe with the official IFrame API, resumes at last position,
// samples watch time while playing, reports every 15s + on pause/end/leave.

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
const SAMPLE_EVERY = 5;  // seconds

export default function LessonPlayer({
  courseSlug,
  lessonSlug,
  embedUrl,
  title,
  duration,
  initialPosition,
  initialCompleted,
}: {
  courseSlug: string;
  lessonSlug: string;
  embedUrl: string;
  title: string;
  duration: number;
  initialPosition: number;
  initialCompleted: boolean;
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
          unsentRef.current += delta; // retry on next report
        });
    },
    [courseSlug, lessonSlug],
  );

  useEffect(() => {
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
  }, [send, initialPosition, duration]);

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
        />
      </div>
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
        {initialPosition > 10 && !completed && (
          <span className="text-xs text-zinc-500">
            Resuming from {Math.floor(initialPosition / 60)}:
            {String(Math.floor(initialPosition % 60)).padStart(2, "0")}
          </span>
        )}
      </div>
    </div>
  );
}
