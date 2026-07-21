"use client";

// Quiz player (Quizzes Spec v1.0 §4): forms per question kind, server-graded
// submission, results with correct answers + explanations, retake.

import { useState } from "react";
import Markdown from "@/components/Markdown";

export type PublicQuestion = {
  id: number;
  kind: "multiple_choice" | "binary" | "short_answer";
  prompt_md: string;
  options: string[] | null;
};

type Result = {
  question_id: number;
  correct: boolean;
  correct_answer: number | boolean | string[];
  explanation: string | null;
};

type Graded = { score: number; total: number; results: Result[] };

export default function QuizPlayer({
  courseSlug,
  lessonSlug,
  questions,
}: {
  courseSlug: string;
  lessonSlug: string;
  questions: PublicQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<number, number | boolean | string>>({});
  const [graded, setGraded] = useState<Graded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (id: number, v: number | boolean | string) =>
    setAnswers((a) => ({ ...a, [id]: v }));

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(
      `/api/courses/${courseSlug}/lessons/${lessonSlug}/quiz`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(`Submit failed (${res.status})`);
      return;
    }
    setGraded(await res.json());
  }

  function fmtCorrect(q: PublicQuestion, r: Result): string {
    if (q.kind === "multiple_choice" && q.options)
      return q.options[r.correct_answer as number] ?? String(r.correct_answer);
    if (q.kind === "binary") return r.correct_answer ? "True" : "False";
    return (r.correct_answer as string[]).join(" / ");
  }

  const resultFor = (id: number) => graded?.results.find((r) => r.question_id === id);

  return (
    <div className="space-y-6">
      {graded && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-lg font-semibold">
            Score: {graded.score}/{graded.total}
          </p>
          <button
            onClick={() => {
              setGraded(null);
              setAnswers({});
            }}
            className="mt-2 rounded-full border border-emerald-300 px-4 py-1.5 text-sm font-medium dark:border-emerald-800"
          >
            Retake quiz
          </button>
        </div>
      )}

      {questions.map((q, i) => {
        const r = resultFor(q.id);
        return (
          <div
            key={q.id}
            className={`rounded-2xl border p-5 ${
              r
                ? r.correct
                  ? "border-emerald-300 dark:border-emerald-800"
                  : "border-red-300 dark:border-red-900"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm font-semibold text-zinc-400">
                {i + 1}.
              </span>
              <div className="flex-1 text-sm">
                <Markdown>{q.prompt_md}</Markdown>
              </div>
              {r && (
                <span className={r.correct ? "text-emerald-500" : "text-red-500"}>
                  {r.correct ? "✓" : "✗"}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2 pl-6">
              {q.kind === "multiple_choice" &&
                q.options?.map((opt, oi) => (
                  <label key={oi} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      disabled={!!graded}
                      checked={answers[q.id] === oi}
                      onChange={() => set(q.id, oi)}
                    />
                    {opt}
                  </label>
                ))}
              {q.kind === "binary" &&
                [true, false].map((v) => (
                  <label key={String(v)} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      disabled={!!graded}
                      checked={answers[q.id] === v}
                      onChange={() => set(q.id, v)}
                    />
                    {v ? "True" : "False"}
                  </label>
                ))}
              {q.kind === "short_answer" && (
                <input
                  disabled={!!graded}
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  placeholder="Your answer"
                  className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
                />
              )}
            </div>

            {r && !r.correct && (
              <p className="mt-3 pl-6 text-sm text-zinc-600 dark:text-zinc-400">
                Correct answer:{" "}
                <span className="font-medium">{fmtCorrect(q, r)}</span>
              </p>
            )}
            {r && r.explanation && (
              <div className="mt-2 rounded-xl bg-zinc-50 p-3 pl-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <Markdown>{r.explanation}</Markdown>
              </div>
            )}
          </div>
        );
      })}

      {!graded && (
        <div>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={busy || Object.keys(answers).length === 0}
            className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? "Grading…" : "Submit Answers"}
          </button>
        </div>
      )}
    </div>
  );
}
