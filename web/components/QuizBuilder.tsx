"use client";

// Admin quiz builder (Quizzes Spec v1.0 §4) — lives on the quiz lesson page.
// Immediate CRUD against the admin API; reloads to reflect.

import { useEffect, useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";

type AdminQuestion = {
  id: number;
  kind: "multiple_choice" | "binary" | "short_answer";
  prompt_md: string;
  options: string[] | null;
  correct: number | boolean | string[];
  explanation_md: string | null;
};

const KIND_LABELS = {
  multiple_choice: "Multiple choice",
  binary: "True / False",
  short_answer: "Short answer",
} as const;

function QuestionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AdminQuestion;
  onSave: (payload: object) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<AdminQuestion["kind"]>(initial?.kind ?? "multiple_choice");
  const [prompt, setPrompt] = useState(initial?.prompt_md ?? "");
  const [options, setOptions] = useState<string[]>(
    initial?.options ?? ["", ""],
  );
  const [correctIndex, setCorrectIndex] = useState<number>(
    typeof initial?.correct === "number" ? initial.correct : 0,
  );
  const [correctBool, setCorrectBool] = useState<boolean>(
    typeof initial?.correct === "boolean" ? initial.correct : true,
  );
  const [answers, setAnswers] = useState<string>(
    Array.isArray(initial?.correct) ? (initial.correct as string[]).join(", ") : "",
  );
  const [explanation, setExplanation] = useState(initial?.explanation_md ?? "");

  const field =
    "w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950";

  function save() {
    const payload: Record<string, unknown> = {
      kind,
      prompt_md: prompt,
      explanation_md: explanation,
    };
    if (kind === "multiple_choice") {
      payload.options = options.filter((o) => o.trim());
      payload.correct = correctIndex;
    } else if (kind === "binary") {
      payload.correct = correctBool;
    } else {
      payload.correct = answers.split(",").map((a) => a.trim()).filter(Boolean);
    }
    onSave(payload);
  }

  return (
    <div className="space-y-3 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as AdminQuestion["kind"])}
        className={field}
      >
        {Object.entries(KIND_LABELS).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Question prompt (markdown)"
        rows={2}
        className={field}
      />
      {kind === "multiple_choice" && (
        <div className="space-y-1.5">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                title="Correct answer"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
              />
              <input
                value={o}
                onChange={(e) =>
                  setOptions(options.map((x, xi) => (xi === i ? e.target.value : x)))
                }
                placeholder={`Option ${i + 1}`}
                className={field}
              />
              {options.length > 2 && (
                <button
                  onClick={() => setOptions(options.filter((_, xi) => xi !== i))}
                  className="text-zinc-400 hover:text-red-500"
                >
                  🗑
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setOptions([...options, ""])}
            className="text-xs text-emerald-600"
          >
            + option
          </button>
        </div>
      )}
      {kind === "binary" && (
        <div className="flex gap-4">
          {[true, false].map((v) => (
            <label key={String(v)} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="correctBool"
                checked={correctBool === v}
                onChange={() => setCorrectBool(v)}
              />
              Correct: {v ? "True" : "False"}
            </label>
          ))}
        </div>
      )}
      {kind === "short_answer" && (
        <input
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
          placeholder="Acceptable answers, comma-separated"
          className={field}
        />
      )}
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Explanation shown after submission (optional, markdown)"
        rows={2}
        className={field}
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-medium text-white"
        >
          Save question
        </button>
        <button onClick={onCancel} className="text-xs text-zinc-500">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function QuizBuilder({
  courseSlug,
  lessonSlug,
}: {
  courseSlug: string;
  lessonSlug: string;
}) {
  const isAdmin = useIsAdmin();
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [editing, setEditing] = useState<number | "new" | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/admin/courses/${courseSlug}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        for (const m of d.modules)
          for (const l of m.lessons)
            if (l.slug === lessonSlug) setLessonId(l.id);
      })
      .catch(() => {});
  }, [isAdmin, courseSlug, lessonSlug]);

  useEffect(() => {
    if (lessonId === null) return;
    fetch(`/api/admin/lessons/${lessonId}/questions`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setQuestions(d?.questions ?? []))
      .catch(() => {});
  }, [lessonId]);

  if (!isAdmin || lessonId === null) return null;

  async function saveQuestion(payload: object, id?: number) {
    const url = id
      ? `/api/admin/questions/${id}`
      : `/api/admin/lessons/${lessonId}/questions`;
    const r = await fetch(url, {
      method: id ? "PUT" : "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) window.location.reload();
    else alert(`Save failed: ${await r.text()}`);
  }

  async function remove(id: number) {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/admin/questions/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    window.location.reload();
  }

  return (
    <div className="mt-10 rounded-2xl border-2 border-dashed border-emerald-300 p-5 dark:border-emerald-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
        Quiz builder (admin)
      </p>
      <ul className="mt-3 space-y-3">
        {questions.map((q, i) => (
          <li key={q.id} className="text-sm">
            {editing === q.id ? (
              <QuestionForm
                initial={q}
                onSave={(p) => saveQuestion(p, q.id)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-zinc-400">{i + 1}.</span>
                <span className="flex-1">
                  {q.prompt_md}{" "}
                  <span className="text-xs text-zinc-400">
                    ({KIND_LABELS[q.kind]})
                  </span>
                </span>
                <button
                  onClick={() => setEditing(q.id)}
                  className="text-xs text-emerald-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(q.id)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  🗑
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {editing === "new" ? (
        <div className="mt-3">
          <QuestionForm onSave={(p) => saveQuestion(p)} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <button
          onClick={() => setEditing("new")}
          className="mt-3 text-sm font-medium text-emerald-600"
        >
          + Add question
        </button>
      )}
    </div>
  );
}
