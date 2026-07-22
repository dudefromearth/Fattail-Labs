"use client";

// Right-rail course navigation on lesson pages: modules → lessons with
// completion ticks (GET /api/me/progress) and current-lesson highlight.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CourseDetail } from "@/lib/types";
import { PROGRESS_EVENT, type ProgressDetail } from "@/lib/progressEvents";

type ProgressMap = Record<
  string,
  { completed: boolean; last_position?: number; watch_seconds?: number }
>;

function LessonGlyph({ kind }: { kind: string }) {
  const g =
    kind === "video"
      ? "▶"
      : kind === "quiz"
        ? "?"
        : kind === "download"
          ? "⤓"
          : "·";
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[10px] text-zinc-400">
      {g}
    </span>
  );
}

function CompletionDot({
  completed,
  current,
}: {
  completed: boolean;
  current: boolean;
}) {
  if (completed) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
        aria-label="Completed"
        title="Completed"
      >
        ✓
      </span>
    );
  }
  if (current) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
        aria-label="Current lesson"
        title="Current lesson"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
    );
  }
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600"
      aria-label="Not completed"
      title="Not completed"
    />
  );
}

export default function LessonCourseNav({
  course,
  currentLessonSlug,
}: {
  course: CourseDetail;
  currentLessonSlug: string;
}) {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/me/progress?course=${encodeURIComponent(course.slug)}`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.lessons) setProgress(d.lessons);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [course.slug]);

  useEffect(() => {
    function onProgress(e: Event) {
      const detail = (e as CustomEvent<ProgressDetail>).detail;
      if (!detail || detail.courseSlug !== course.slug) return;
      if (detail.completed) {
        setProgress((p) => ({
          ...p,
          [detail.lessonSlug]: {
            ...p[detail.lessonSlug],
            completed: true,
          },
        }));
      }
    }
    window.addEventListener(PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(PROGRESS_EVENT, onProgress);
  }, [course.slug]);

  const { done, total } = useMemo(() => {
    const lessons = course.modules.flatMap((m) => m.lessons);
    const total = lessons.length;
    const done = lessons.filter((l) => progress[l.slug]?.completed).length;
    return { done, total };
  }, [course.modules, progress]);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <nav
      aria-label="Course lessons"
      className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-20"
    >
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm font-semibold leading-snug hover:text-emerald-600"
        >
          {course.title}
        </Link>
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>
              {done}/{total} complete
            </span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-h-[min(70vh,36rem)] overflow-y-auto py-2">
        {course.modules.map((mod, mi) => (
          <div key={`${mi}-${mod.title}`} className="mb-1">
            <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {mod.title}
            </p>
            <ul className="space-y-0.5">
              {mod.lessons.map((l) => {
                const current = l.slug === currentLessonSlug;
                const completed = !!progress[l.slug]?.completed;
                return (
                  <li key={l.slug}>
                    <Link
                      href={`/courses/${course.slug}/lessons/${l.slug}`}
                      aria-current={current ? "page" : undefined}
                      className={`flex items-start gap-2 px-3 py-2 text-sm transition-colors ${
                        current
                          ? "bg-emerald-50 font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <CompletionDot completed={completed} current={current} />
                      <LessonGlyph kind={l.kind} />
                      <span className="min-w-0 flex-1 leading-snug">
                        <span className="line-clamp-2">{l.title}</span>
                        {l.duration_seconds > 0 && (
                          <span className="mt-0.5 block text-[11px] font-normal text-zinc-400">
                            {Math.max(1, Math.round(l.duration_seconds / 60))}{" "}
                            min
                            {l.free_preview ? " · Free" : ""}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
