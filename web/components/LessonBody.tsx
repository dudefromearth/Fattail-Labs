"use client";

// Lesson notes under the video (spec v1.1 §5): full markdown for everyone;
// admins click the block to edit it in place. Standalone save — the lesson
// page is dynamic, no revalidation needed.

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";

export default function LessonBody({
  courseSlug,
  lessonSlug,
  body,
}: {
  courseSlug: string;
  lessonSlug: string;
  body: string | null;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [current, setCurrent] = useState(body ?? "");
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!cancelled && me?.role === "administrator") setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin || lessonId !== null) return;
    fetch(`/api/admin/courses/${courseSlug}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        for (const m of d.modules)
          for (const l of m.lessons)
            if (l.slug === lessonSlug) setLessonId(l.id);
      })
      .catch(() => {});
  }, [isAdmin, lessonId, courseSlug, lessonSlug]);

  useEffect(() => {
    if (editing && !preview) areaRef.current?.focus();
  }, [editing, preview]);

  async function save() {
    if (lessonId === null) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body_md: draft }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(`Save failed (${res.status})`);
      return;
    }
    setCurrent(draft);
    setEditing(false);
  }

  if (!current && !isAdmin) return null;

  if (!editing) {
    return (
      <div
        className={`mt-8 ${
          isAdmin
            ? "cursor-pointer rounded-xl outline-dashed outline-1 outline-offset-8 outline-emerald-400/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
            : ""
        }`}
        title={isAdmin ? "Click to edit lesson notes" : undefined}
        onClick={() => {
          if (!isAdmin) return;
          setDraft(current);
          setPreview(false);
          setEditing(true);
        }}
      >
        {current ? (
          <Markdown>{current}</Markdown>
        ) : (
          <p className="text-sm italic text-zinc-400">
            No lesson notes yet — click to add (markdown).
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl ring-2 ring-emerald-500">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">
        <button
          onClick={() => setPreview(false)}
          className={`rounded-full px-2.5 py-0.5 ${!preview ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Markdown
        </button>
        <button
          onClick={() => setPreview(true)}
          className={`rounded-full px-2.5 py-0.5 ${preview ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Preview
        </button>
        {error && <span className="text-red-600">{error}</span>}
        <span className="ml-auto flex gap-2">
          <button onClick={() => setEditing(false)} className="text-zinc-500">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || lessonId === null}
            className="font-medium text-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </span>
      </div>
      {preview ? (
        <div className="p-3">
          <Markdown>{draft}</Markdown>
        </div>
      ) : (
        <textarea
          ref={areaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.max(8, draft.split("\n").length + 2)}
          className="w-full resize-y bg-transparent p-3 font-mono text-sm outline-none"
        />
      )}
    </div>
  );
}
