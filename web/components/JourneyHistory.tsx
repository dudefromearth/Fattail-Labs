"use client";

// Quiz results + activity — moved from My Learning into Journey.

import Link from "next/link";
import { useEffect, useState } from "react";

type ActivityEvent = {
  type: "enrolled" | "course_completed" | "lesson_watched" | "lesson_completed";
  at: string;
  course_slug: string;
  course_title: string;
  module_slug?: string;
  lesson_slug?: string;
  lesson_title?: string;
};

type QuizAttempt = {
  quiz_title: string;
  module_slug?: string;
  lesson_slug: string;
  course_slug: string;
  course_title: string;
  score: number;
  total: number;
  submitted_at: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EVENT_LABEL: Record<ActivityEvent["type"], string> = {
  enrolled: "Enrolled in",
  course_completed: "Completed course",
  lesson_watched: "Watched",
  lesson_completed: "Completed",
};

export default function JourneyHistory() {
  const [quizzes, setQuizzes] = useState<QuizAttempt[] | null>(null);
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/me/quiz-results", { credentials: "same-origin" }),
      fetch("/api/me/activity", { credentials: "same-origin" }),
    ])
      .then(async ([qr, ar]) => {
        const q = qr.ok ? await qr.json() : { attempts: [] };
        const a = ar.ok ? await ar.json() : { events: [] };
        if (!cancelled) {
          setQuizzes(q.attempts ?? []);
          setEvents(a.events ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuizzes([]);
          setEvents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="text-lg font-semibold">Quiz results</h2>
        {quizzes === null && (
          <p className="mt-3 text-sm text-[var(--color-label-tertiary)]">Loading…</p>
        )}
        {quizzes && quizzes.length === 0 && (
          <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
            No quiz attempts yet.
          </p>
        )}
        {quizzes && quizzes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {quizzes.map((q, i) => (
              <li
                key={i}
                className="surface-card flex flex-wrap items-center gap-x-3 border border-[var(--color-separator)] px-4 py-3 text-sm"
              >
                <Link
                  href={
                    q.module_slug
                      ? `/course/${q.course_slug}/${q.module_slug}/${q.lesson_slug}`
                      : `/course/${q.course_slug}`
                  }
                  className="font-medium hover:underline"
                >
                  {q.quiz_title}
                </Link>
                <span className="text-[var(--color-label-tertiary)]">
                  in {q.course_title}
                </span>
                <span
                  className={`ml-auto font-semibold ${
                    q.score === q.total
                      ? "text-[var(--color-tint)]"
                      : "text-[var(--color-label-secondary)]"
                  }`}
                >
                  {q.score}/{q.total}
                </span>
                <span className="text-xs text-[var(--color-label-tertiary)]">
                  {fmtDate(q.submitted_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Activity</h2>
        {events === null && (
          <p className="mt-3 text-sm text-[var(--color-label-tertiary)]">Loading…</p>
        )}
        {events && events.length === 0 && (
          <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
            No activity yet.
          </p>
        )}
        {events && events.length > 0 && (
          <ul className="mt-4 space-y-1">
            {events.map((ev, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-2 rounded-lg px-3 py-2 text-sm odd:bg-[var(--color-fill)]"
              >
                <span className="text-[var(--color-label-secondary)]">
                  {EVENT_LABEL[ev.type]}
                </span>
                {ev.lesson_slug ? (
                  <>
                    <Link
                      href={
                        ev.module_slug
                          ? `/course/${ev.course_slug}/${ev.module_slug}/${ev.lesson_slug}`
                          : `/course/${ev.course_slug}`
                      }
                      className="font-medium hover:underline"
                    >
                      {ev.lesson_title}
                    </Link>
                    <span className="text-[var(--color-label-tertiary)]">
                      in {ev.course_title}
                    </span>
                  </>
                ) : (
                  <Link
                    href={`/course/${ev.course_slug}`}
                    className="font-medium hover:underline"
                  >
                    {ev.course_title}
                  </Link>
                )}
                <span className="ml-auto text-xs text-[var(--color-label-tertiary)]">
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
