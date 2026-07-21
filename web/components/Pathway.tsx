"use client";

// Pathway assessment + sequence (Pathway Spec v1.0 §4).

import Link from "next/link";
import { useEffect, useState } from "react";

type Step = {
  slug: string;
  title: string;
  level: string;
  percent: number;
  done: boolean;
  resume: { lesson_slug: string } | null;
};

type PathwayData = {
  answers: Record<string, string>;
  steps: Step[];
};

const QUESTIONS: {
  key: string;
  prompt: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "experience",
    prompt: "How long have you been trading options?",
    options: [
      { value: "new", label: "I'm new to options" },
      { value: "some", label: "Under two years" },
      { value: "experienced", label: "Two years or more" },
    ],
  },
  {
    key: "account",
    prompt: "Which describes your account lately?",
    options: [
      { value: "bleeding", label: "Giving back gains or losing steadily" },
      { value: "flat", label: "Roughly breakeven" },
      { value: "growing", label: "Consistently profitable" },
    ],
  },
  {
    key: "struggle",
    prompt: "What's your biggest struggle?",
    options: [
      { value: "risk", label: "Losses are too big when I'm wrong" },
      { value: "chasing", label: "Overtrading and revenge trading" },
      { value: "routine", label: "Inconsistent process and preparation" },
      { value: "edge", label: "Finding good setups" },
    ],
  },
  {
    key: "time",
    prompt: "How much time can you give this per day?",
    options: [
      { value: "minutes", label: "Under 30 minutes" },
      { value: "hour", label: "30–90 minutes" },
      { value: "more", label: "More than 90 minutes" },
    ],
  },
];

function Assessment({ onDone }: { onDone: (p: PathwayData) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = QUESTIONS.every((q) => answers[q.key]);

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/me/pathway", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setBusy(false);
    if (!r.ok) {
      setError(`Failed (${r.status})`);
      return;
    }
    const d = await r.json();
    onDone(d.pathway);
  }

  return (
    <div className="space-y-8">
      {QUESTIONS.map((q, i) => (
        <fieldset key={q.key}>
          <legend className="font-medium">
            {i + 1}. {q.prompt}
          </legend>
          <div className="mt-3 space-y-2">
            {q.options.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  answers[q.key] === o.value
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
                }`}
              >
                <input
                  type="radio"
                  name={q.key}
                  checked={answers[q.key] === o.value}
                  onChange={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={!complete || busy}
        className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        {busy ? "Building your pathway…" : "Build My Pathway"}
      </button>
    </div>
  );
}

export default function Pathway() {
  const [state, setState] = useState<
    "loading" | "anonymous" | "assess" | PathwayData
  >("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/pathway", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) return "anonymous" as const;
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (cancelled || d === null) return;
        if (d === "anonymous") setState("anonymous");
        else setState(d.pathway ?? "assess");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading")
    return <p className="text-sm text-zinc-400">Loading…</p>;

  if (state === "anonymous") {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="font-medium">
          Create a free account to build your personalized pathway
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (state === "assess") {
    return <Assessment onDone={(p) => setState(p)} />;
  }

  const firstIncomplete = state.steps.find((s) => !s.done);

  return (
    <div>
      <ol className="space-y-3">
        {state.steps.map((s, i) => {
          const isNext = firstIncomplete?.slug === s.slug;
          return (
            <li
              key={s.slug}
              className={`flex flex-wrap items-center gap-4 rounded-2xl border p-5 ${
                isNext
                  ? "border-emerald-400 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  s.done
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/courses/${s.slug}`}
                  className="font-semibold hover:underline"
                >
                  {s.title}
                </Link>
                <span className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span
                      className="block h-full rounded-full bg-emerald-500"
                      style={{ width: `${s.percent}%` }}
                    />
                  </span>
                  <span className="text-xs text-zinc-500">{s.percent}%</span>
                </span>
              </span>
              {isNext && (
                <Link
                  href={
                    s.resume
                      ? `/courses/${s.slug}/lessons/${s.resume.lesson_slug}`
                      : `/courses/${s.slug}`
                  }
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  Start here
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <button
        onClick={() => setState("assess")}
        className="mt-6 text-sm text-zinc-500 hover:underline"
      >
        Retake the assessment
      </button>
    </div>
  );
}
