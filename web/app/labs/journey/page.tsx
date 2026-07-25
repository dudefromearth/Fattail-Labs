"use client";

// Journey — Family B presentation of existing progress (no second store).
// Application Framework C5 · Member-Data-Privacy DS-2

import { useEffect, useState } from "react";
import Link from "next/link";

type JourneyCourse = {
  slug: string;
  title: string;
  level: string;
  percent: number;
  lessons_done: number;
  lessons_total: number;
  enrolled_at: string;
  completed_at: string | null;
  resume: {
    lesson_slug: string;
    title: string;
    module_title: string;
  } | null;
};

type Journey = {
  source: string;
  stats: {
    courses_enrolled: number;
    courses_completed: number;
    courses_in_progress: number;
    lessons_completed: number;
    watch_seconds: number;
  };
  courses: JourneyCourse[];
};

function fmtWatch(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function JourneyPage() {
  const [data, setData] = useState<Journey | null | "anon" | "err">(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/journey", { credentials: "same-origin" })
      .then(async (r): Promise<Journey | "anon" | "err"> => {
        if (r.status === 401) return "anon";
        if (r.status === 404) return "err";
        if (!r.ok) return "err";
        return (await r.json()) as Journey;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData("err");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/labs" className="hover:underline">
          Labs
        </Link>
        <span className="mx-2">›</span>
        <span>Journey</span>
      </nav>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-label)]">
        Journey
      </h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Your path through the library — enrollments and progress only. Process
        over pace; no leaderboards.
      </p>

      {data === null && (
        <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">Loading…</p>
      )}
      {data === "anon" && (
        <p className="mt-8 text-sm">
          <Link href="/login" className="font-medium text-[var(--color-tint)]">
            Sign in
          </Link>{" "}
          to see your journey.
        </p>
      )}
      {data === "err" && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Could not load Journey</p>
          <p className="mt-1 text-xs opacity-90">
            If this persists, restart the Labs API so the{" "}
            <code className="font-mono">/api/me/journey</code> route is loaded.
          </p>
        </div>
      )}
      {data && typeof data === "object" && (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["Enrolled", data.stats.courses_enrolled],
                ["In progress", data.stats.courses_in_progress],
                ["Completed", data.stats.courses_completed],
                ["Lessons done", data.stats.lessons_completed],
              ] as const
            ).map(([label, n]) => (
              <div
                key={label}
                className="surface-card border border-[var(--color-separator)] p-4"
              >
                <dt className="text-xs text-[var(--color-label-tertiary)]">
                  {label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-[var(--color-label)]">
                  {n}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-[var(--color-label-tertiary)]">
            Watch time recorded: {fmtWatch(data.stats.watch_seconds)} · source{" "}
            {data.source}
          </p>

          <ul className="mt-8 space-y-3">
            {data.courses.length === 0 && (
              <li className="text-sm text-[var(--color-label-secondary)]">
                No enrollments yet.{" "}
                <Link href="/courses" className="text-[var(--color-tint)]">
                  Browse courses
                </Link>
              </li>
            )}
            {data.courses.map((c) => (
              <li
                key={c.slug}
                className="surface-card border border-[var(--color-separator)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/courses/${c.slug}`}
                    className="font-semibold text-[var(--color-label)] hover:underline"
                  >
                    {c.title}
                  </Link>
                  <span className="text-xs text-[var(--color-label-tertiary)]">
                    {c.percent}% · {c.lessons_done}/{c.lessons_total} lessons
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-fill)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-tint)]"
                    style={{ width: `${Math.min(100, c.percent)}%` }}
                  />
                </div>
                {c.resume && !c.completed_at && (
                  <Link
                    href={`/courses/${c.slug}/lessons/${c.resume.lesson_slug}`}
                    className="mt-3 inline-block text-sm font-medium text-[var(--color-tint)] hover:underline"
                  >
                    Continue: {c.resume.title} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
