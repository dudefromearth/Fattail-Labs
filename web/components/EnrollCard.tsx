"use client";

// Course-page right rail: session-aware enrollment card. The static page ships
// the neutral shell; this upgrades after hydration.
// anon -> Join CTA · signed in -> Enroll button · enrolled -> progress + Continue.

import Link from "next/link";
import { useEffect, useState } from "react";

type Enrollment = {
  course: { slug: string };
  completed_at: string | null;
  progress: { total: number; done: number; percent: number };
  resume: { lesson_slug: string; title: string } | null;
};

export default function EnrollCard({
  slug,
  enrolledCount,
}: {
  slug: string;
  enrolledCount: number;
}) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "anonymous" }
    | { kind: "not_enrolled" }
    | { kind: "enrolled"; enrollment: Enrollment }
  >({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/enrollments", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) return "anonymous" as const;
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (cancelled || d === null) return;
        if (d === "anonymous") {
          setState({ kind: "anonymous" });
          return;
        }
        const mine = (d.enrollments as Enrollment[]).find(
          (e) => e.course.slug === slug,
        );
        setState(mine ? { kind: "enrolled", enrollment: mine } : { kind: "not_enrolled" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function enroll() {
    setBusy(true);
    const res = await fetch(`/api/courses/${slug}/enroll`, {
      method: "POST",
      credentials: "same-origin",
    });
    setBusy(false);
    if (res.ok) {
      // Refetch for the summary (resume target etc.).
      const d = await fetch("/api/me/enrollments", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const mine = d?.enrollments?.find(
        (e: Enrollment) => e.course.slug === slug,
      );
      if (mine) setState({ kind: "enrolled", enrollment: mine });
    }
  }

  return (
    <aside className="h-fit rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="font-semibold">My Progress</h2>

      {(state.kind === "loading" ||
        state.kind === "anonymous" ||
        state.kind === "not_enrolled") && (
        <>
          <div className="mt-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          <p className="mt-2 text-sm text-zinc-500">Not started yet</p>
        </>
      )}

      {state.kind === "anonymous" && (
        <Link
          href="/signup"
          className="mt-4 block rounded-full bg-emerald-500 py-2.5 text-center font-medium text-white transition-colors hover:bg-emerald-600"
        >
          Join to Enroll
        </Link>
      )}

      {state.kind === "not_enrolled" && (
        <button
          onClick={enroll}
          disabled={busy}
          className="mt-4 block w-full rounded-full bg-emerald-500 py-2.5 text-center font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? "Enrolling…" : "Enroll"}
        </button>
      )}

      {state.kind === "enrolled" && (
        <>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${state.enrollment.progress.percent}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500">
              {state.enrollment.progress.percent}%
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {state.enrollment.progress.done}/{state.enrollment.progress.total}{" "}
            lessons
          </p>
          {state.enrollment.completed_at ? (
            <p className="mt-4 rounded-full bg-emerald-100 py-2.5 text-center font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              ✓ Course completed
            </p>
          ) : state.enrollment.resume ? (
            <Link
              href={`/courses/${slug}/lessons/${state.enrollment.resume.lesson_slug}`}
              className="mt-4 block rounded-full bg-emerald-500 py-2.5 text-center font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Continue
            </Link>
          ) : null}
        </>
      )}

      <p className="mt-3 text-center text-xs text-zinc-400">
        {enrolledCount} enrolled
      </p>
    </aside>
  );
}
