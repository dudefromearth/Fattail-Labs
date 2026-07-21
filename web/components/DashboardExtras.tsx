"use client";

// Dashboard rows: Your Pathway (next step) + Next Live Session.

import Link from "next/link";
import { useEffect, useState } from "react";

type Step = { slug: string; title: string; percent: number; done: boolean };
type Session = { id: number; title: string; kind: string; starts_at: string };

export default function DashboardExtras() {
  const [nextStep, setNextStep] = useState<Step | null | "none">(null);
  const [nextSession, setNextSession] = useState<Session | null | "none">(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/pathway", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const step = d?.pathway?.steps?.find((s: Step) => !s.done);
        setNextStep(step ?? "none");
      })
      .catch(() => {});
    fetch("/api/live/sessions", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        setNextSession(d?.upcoming?.[0] ?? "none");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Your Pathway
        </h2>
        {nextStep === null && <p className="mt-3 text-sm text-zinc-400">Loading…</p>}
        {nextStep === "none" && (
          <p className="mt-3 text-sm">
            <Link href="/pathway" className="text-emerald-600 hover:underline">
              Take the 2-minute assessment
            </Link>{" "}
            to get your personalized course path.
          </p>
        )}
        {nextStep !== null && nextStep !== "none" && (
          <div className="mt-3">
            <p className="text-sm text-zinc-500">Next step</p>
            <Link
              href={`/courses/${nextStep.slug}`}
              className="font-semibold hover:underline"
            >
              {nextStep.title}
            </Link>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${nextStep.percent}%` }}
              />
            </div>
            <Link
              href="/pathway"
              className="mt-3 inline-block text-xs text-zinc-500 hover:underline"
            >
              View full pathway →
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Next Live Session
        </h2>
        {nextSession === null && <p className="mt-3 text-sm text-zinc-400">Loading…</p>}
        {nextSession === "none" && (
          <p className="mt-3 text-sm text-zinc-500">Nothing scheduled yet.</p>
        )}
        {nextSession !== null && nextSession !== "none" && (
          <div className="mt-3">
            <p className="font-semibold">{nextSession.title}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {new Date(nextSession.starts_at).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <Link
              href="/live"
              className="mt-3 inline-block rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
            >
              View schedule
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
