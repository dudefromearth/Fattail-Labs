"use client";

// Lesson notes under the video (spec v1.1 §5; images per In-Place Admin v1.5):
// full markdown for everyone; admins click the block to edit it in place.
// Images embed by toolbar upload, paste, or drag-drop — stored in the public
// media tier, inserted as ![alt](url) at the cursor. Standalone save — the
// lesson page is dynamic, no revalidation needed.

import { useEffect, useRef, useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { uploadMedia } from "@/lib/client";
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
  const isAdmin = useIsAdmin();
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [current, setCurrent] = useState(body ?? "");
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(current);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

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

  function insertAtCursor(snippet: string) {
    const ta = areaRef.current;
    if (!ta) {
      setDraft((d) => (d ? `${d}\n${snippet}` : snippet));
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    setDraft((d) => d.slice(0, start) + snippet + d.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // GitHub-style flow: placeholder at the cursor immediately, swapped for the
  // real markdown when the upload lands (or removed on failure).
  async function embedImages(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setError(null);
    for (const file of images) {
      const alt = file.name.replace(/\.[^.]+$/, "");
      const placeholder = `![Uploading ${file.name}…]()`;
      insertAtCursor(`${placeholder}\n`);
      setUploading((n) => n + 1);
      const url = await uploadMedia(file);
      setUploading((n) => n - 1);
      if (url) {
        setDraft((d) => d.replace(placeholder, `![${alt}](${url})`));
      } else {
        setDraft((d) => d.replace(`${placeholder}\n`, "").replace(placeholder, ""));
        setError("Image upload failed");
      }
    }
  }

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
        <label
          className="cursor-pointer rounded-full border border-zinc-300 px-2.5 py-0.5 font-medium text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
          title="Upload an image and embed it at the cursor (or paste / drag one in)"
        >
          🖼 Insert image…
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) embedImages([...e.target.files]);
              e.target.value = "";
            }}
          />
        </label>
        {uploading > 0 && (
          <span className="text-emerald-600">Uploading image…</span>
        )}
        {error && <span className="text-red-600">{error}</span>}
        <span className="ml-auto flex gap-2">
          <button onClick={() => setEditing(false)} className="text-zinc-500">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || uploading > 0 || lessonId === null}
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
          onPaste={(e) => {
            const files = [...e.clipboardData.files];
            if (files.some((f) => f.type.startsWith("image/"))) {
              e.preventDefault();
              embedImages(files);
            }
          }}
          onDrop={(e) => {
            const files = [...e.dataTransfer.files];
            if (files.some((f) => f.type.startsWith("image/"))) {
              e.preventDefault();
              embedImages(files);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          rows={Math.max(8, draft.split("\n").length + 2)}
          className="w-full resize-y bg-transparent p-3 font-mono text-sm outline-none"
          placeholder="Write markdown — paste or drag images straight in."
        />
      )}
    </div>
  );
}
