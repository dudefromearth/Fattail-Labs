"use client";

// Student page — full record: stats, enrollments, quiz placeholder, activity.
// Everything derives from /api/me/enrollments + /api/me/activity.

import Link from "next/link";
import { useEffect, useState } from "react";

type Enrollment = {
  course: { slug: string; title: string; level: string };
  enrolled_at: string;
  completed_at: string | null;
  progress: { total: number; done: number; percent: number };
  resume: { lesson_slug: string; title: string } | null;
};

type ActivityEvent = {
  type: "enrolled" | "course_completed" | "lesson_watched" | "lesson_completed";
  at: string;
  course_slug: string;
  course_title: string;
  lesson_slug?: string;
  lesson_title?: string;
};

type QuizAttempt = {
  quiz_title: string;
  lesson_slug: string;
  course_slug: string;
  course_title: string;
  score: number;
  total: number;
  submitted_at: string;
};

type Data = {
  enrollments: Enrollment[];
  events: ActivityEvent[];
  stats: { lessons_completed: number; watch_seconds: number };
  quizzes: QuizAttempt[];
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtWatch(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const EVENT_LABEL: Record<ActivityEvent["type"], string> = {
  enrolled: "Enrolled in",
  course_completed: "Completed course",
  lesson_watched: "Watched",
  lesson_completed: "Completed",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}

export default function MyLearning() {
  const [data, setData] = useState<Data | null | "anonymous">(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/me/enrollments", { credentials: "same-origin" }),
      fetch("/api/me/activity", { credentials: "same-origin" }),
      fetch("/api/me/quiz-results", { credentials: "same-origin" }),
    ])
      .then(async ([er, ar, qr]) => {
        if (er.status === 401 || ar.status === 401) return "anonymous" as const;
        const e = await er.json();
        const a = await ar.json();
        const q = qr.ok ? await qr.json() : { attempts: [] };
        return {
          enrollments: e.enrollments,
          events: a.events,
          stats: a.stats,
          quizzes: q.attempts,
        };
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (data === null) return <p className="text-sm text-zinc-400">Loading…</p>;

  if (data === "anonymous") {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="font-medium">Sign in to see your learning record</p>
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

  const completedCourses = data.enrollments.filter((e) => e.completed_at).length;

  async function manageBilling() {
    const r = await fetch("/api/billing/portal", {
      method: "POST",
      credentials: "same-origin",
    });
    if (r.ok) {
      const { url } = await r.json();
      window.location.href = url;
    }
  }

  return (
    <div className="space-y-10">
      <div className="-mt-4 text-right">
        <button
          onClick={manageBilling}
          className="text-sm text-zinc-500 hover:underline"
        >
          Manage billing
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Courses enrolled" value={data.enrollments.length} />
        <Stat label="Courses completed" value={completedCourses} />
        <Stat label="Lessons completed" value={data.stats.lessons_completed} />
        <Stat label="Watch time" value={fmtWatch(data.stats.watch_seconds)} />
      </div>

      {/* Enrollments */}
      <section>
        <h2 className="text-lg font-semibold">Enrollments</h2>
        {data.enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No enrollments yet —{" "}
            <Link href="/courses" className="text-emerald-600 hover:underline">
              browse the courses
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.enrollments.map((e) => (
              <li
                key={e.course.slug}
                className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/courses/${e.course.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {e.course.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Enrolled {fmtDate(e.enrolled_at)}
                      {e.completed_at && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Completed {fmtDate(e.completed_at)}
                        </span>
                      )}
                    </p>
                  </div>
                  {e.completed_at ? (
                    <Link
                      href={`/courses/${e.course.slug}`}
                      className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium dark:border-zinc-700"
                    >
                      Review
                    </Link>
                  ) : (
                    e.resume && (
                      <Link
                        href={`/courses/${e.course.slug}/lessons/${e.resume.lesson_slug}`}
                        className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                      >
                        Continue → {e.resume.title.slice(0, 32)}
                        {e.resume.title.length > 32 ? "…" : ""}
                      </Link>
                    )
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${e.progress.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {e.progress.done}/{e.progress.total} lessons
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quiz results */}
      <section>
        <h2 className="text-lg font-semibold">Quiz Results</h2>
        {data.quizzes.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No quiz attempts yet.
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.quizzes.map((q, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-x-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
              >
                <Link
                  href={`/courses/${q.course_slug}/lessons/${q.lesson_slug}`}
                  className="font-medium hover:underline"
                >
                  {q.quiz_title}
                </Link>
                <span className="text-zinc-400">in {q.course_title}</span>
                <span
                  className={`ml-auto font-semibold ${
                    q.score === q.total ? "text-emerald-600" : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {q.score}/{q.total}
                </span>
                <span className="text-xs text-zinc-400">{fmtDate(q.submitted_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activity */}
      <section>
        <h2 className="text-lg font-semibold">Activity</h2>
        {data.events.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No activity yet.</p>
        ) : (
          <ul className="mt-4 space-y-1">
            {data.events.map((ev, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-2 rounded-lg px-3 py-2 text-sm odd:bg-zinc-50 dark:odd:bg-zinc-900/50"
              >
                <span className="text-zinc-500">{EVENT_LABEL[ev.type]}</span>
                {ev.lesson_slug ? (
                  <>
                    <Link
                      href={`/courses/${ev.course_slug}/lessons/${ev.lesson_slug}`}
                      className="font-medium hover:underline"
                    >
                      {ev.lesson_title}
                    </Link>
                    <span className="text-zinc-400">in {ev.course_title}</span>
                  </>
                ) : (
                  <Link
                    href={`/courses/${ev.course_slug}`}
                    className="font-medium hover:underline"
                  >
                    {ev.course_title}
                  </Link>
                )}
                <span className="ml-auto text-xs text-zinc-400">
                  {fmtDate(ev.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
