"use client";

// Lesson completion — iOS-style UISwitch (Apple HIG toggles).
// Fully two-way: on = complete, off = not complete (undo accidental marks).
// Track ~51×31, thumb ~27, hit region ≥44×44, system green when on.

import { useEffect, useState } from "react";
import {
  PROGRESS_EVENT,
  emitProgress,
  type ProgressDetail,
} from "@/lib/progressEvents";

const IOS_GREEN = "bg-[#34C759]";
const IOS_TRACK_OFF = "bg-[#E9E9EA] dark:bg-[#39393D]";

export default function LessonMarkComplete({
  courseSlug,
  lessonSlug,
  initialCompleted,
  className = "",
  placement,
}: {
  courseSlug: string;
  lessonSlug: string;
  initialCompleted: boolean;
  className?: string;
  /** Optional placement tag for tests / dual controls (top | bottom). */
  placement?: "top" | "bottom";
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted, courseSlug, lessonSlug]);

  useEffect(() => {
    function onProgress(e: Event) {
      const detail = (e as CustomEvent<ProgressDetail>).detail;
      if (
        detail?.courseSlug === courseSlug &&
        detail?.lessonSlug === lessonSlug &&
        typeof detail.completed === "boolean"
      ) {
        setCompleted(detail.completed);
      }
    }
    window.addEventListener(PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(PROGRESS_EVENT, onProgress);
  }, [courseSlug, lessonSlug]);

  async function setCompletion(next: boolean) {
    if (busy || next === completed) return;
    setBusy(true);
    const previous = completed;
    // Optimistic UI — feel like a native switch
    setCompleted(next);
    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_slug: courseSlug,
          lesson_slug: lessonSlug,
          completed: next,
        }),
      });
      if (!res.ok) {
        setCompleted(previous);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        completed?: boolean;
      } | null;
      const final =
        typeof data?.completed === "boolean" ? data.completed : next;
      setCompleted(final);
      emitProgress({ courseSlug, lessonSlug, completed: final });
    } catch {
      setCompleted(previous);
    } finally {
      setBusy(false);
    }
  }

  const labelId = placement
    ? `lesson-complete-label-${lessonSlug}-${placement}`
    : `lesson-complete-label-${lessonSlug}`;

  return (
    <div
      className={`mt-6 flex w-full justify-center ${className}`}
      data-testid={
        placement
          ? `lesson-mark-complete-${placement}`
          : "lesson-mark-complete"
      }
    >
      <div className="inline-flex min-h-11 items-center gap-3 px-1">
        <span
          id={labelId}
          className="select-none text-[17px] leading-none tracking-[-0.01em] text-zinc-900 dark:text-zinc-50"
        >
          Completed
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={completed}
          aria-labelledby={labelId}
          disabled={busy}
          onClick={() => void setCompletion(!completed)}
          className={[
            "relative inline-flex h-11 w-11 shrink-0 items-center justify-center",
            "rounded-full",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
            busy ? "cursor-wait opacity-70" : "cursor-pointer",
          ].join(" ")}
          data-testid="lesson-mark-complete-switch"
        >
          <span
            aria-hidden
            className={[
              "pointer-events-none relative block h-[31px] w-[51px] rounded-full",
              "transition-colors duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]",
              completed ? IOS_GREEN : IOS_TRACK_OFF,
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-[2px] left-[2px] box-border h-[27px] w-[27px] rounded-full bg-white",
                "shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]",
                "transition-transform duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]",
                "will-change-transform",
                completed ? "translate-x-[20px]" : "translate-x-0",
              ].join(" ")}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
