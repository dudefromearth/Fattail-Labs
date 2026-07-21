"use client";

// Dashboard Continue Learning — derived entirely from /api/me/continue.

import Link from "next/link";
import { useEffect, useState } from "react";

type ContinueCourse = {
  course: {
    slug: string;
    title: string;
    level: string;
    total: number;
    completed: number;
    percent: number;
  };
  resume: {
    lesson_slug: string;
    title: string;
    module_title: string;
    last_position: number;
  };
};

export default function ContinueLearning() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "anonymous" }
    | { kind: "ready"; courses: ContinueCourse[] }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/continue", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) return { anonymous: true };
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (cancelled || !d) return;
        if ("anonymous" in d) setState({ kind: "anonymous" });
        else setState({ kind: "ready", courses: d.courses ?? [] });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  if (state.kind === "anonymous") {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="font-medium">Sign in to see your progress</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  if (state.courses.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="font-medium">Nothing in progress yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Start with the flagship — stop the bleeding first.
        </p>
        <Link
          href="/courses/first-stop-the-bleeding"
          className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          First, Stop the Bleeding
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {state.courses.map(({ course, resume }) => (
        <Link
          key={course.slug}
          href={`/courses/${course.slug}/lessons/${resume.lesson_slug}`}
          className="group rounded-2xl border border-zinc-200 p-5 transition-shadow hover:shadow-lg dark:border-zinc-800"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold leading-snug group-hover:underline">
              {course.title}
            </h3>
            <span className="shrink-0 text-xs text-zinc-500">
              {course.completed}/{course.total} lessons
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${course.percent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Resume:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {resume.title}
            </span>
          </p>
          <p className="text-xs text-zinc-400">{resume.module_title}</p>
        </Link>
      ))}
    </div>
  );
}
