"use client";

// Edit-in-place admin: invisible to everyone except administrators. The Edit
// button floats on the production page; activating it opens the editor over
// the same page. Saves go to the admin API, then the static page regenerates.

import { useCallback, useEffect, useState } from "react";

type AdminLesson = {
  id: number;
  slug: string;
  title: string;
  kind: string;
  duration_seconds: number;
  free_preview: boolean;
  video_id: string | null;
  video_params: Record<string, string>;
};

type AdminModule = {
  module_id: number;
  title: string;
  kind: string;
  lessons: AdminLesson[];
};

type AdminCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description_md: string;
  level: string;
  status: string;
  modules: AdminModule[];
};

const field =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function AdminBar({ slug }: { slug: string }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const openEditor = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/admin/courses/${slug}`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      setError(`Failed to load course (${res.status})`);
      return;
    }
    setCourse((await res.json()) as AdminCourse);
    setOpen(true);
  }, [slug]);

  const save = useCallback(async () => {
    if (!course) return;
    setSaving(true);
    setError(null);
    try {
      let res = await fetch(`/api/admin/courses/${slug}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          subtitle: course.subtitle,
          description_md: course.description_md,
          level: course.level,
          status: course.status,
        }),
      });
      if (!res.ok) throw new Error(`course save ${res.status}: ${await res.text()}`);

      for (const m of course.modules) {
        for (const l of m.lessons) {
          res = await fetch(`/api/admin/lessons/${l.id}`, {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: l.title,
              video_id: l.video_id,
              video_params: l.video_params,
              free_preview: l.free_preview,
              duration_seconds: l.duration_seconds,
            }),
          });
          if (!res.ok)
            throw new Error(`lesson "${l.title}" ${res.status}: ${await res.text()}`);
        }
      }

      res = await fetch("/api/revalidate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/courses/${slug}` }),
      });
      if (!res.ok) throw new Error(`revalidate ${res.status}`);

      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }, [course, slug]);

  const patchLesson = useCallback(
    (id: number, patch: Partial<AdminLesson>) => {
      setCourse((c) =>
        c
          ? {
              ...c,
              modules: c.modules.map((m) => ({
                ...m,
                lessons: m.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)),
              })),
            }
          : c,
      );
    },
    [],
  );

  if (!isAdmin) return null;

  if (!open) {
    return (
      <button
        onClick={openEditor}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        ✎ Edit
      </button>
    );
  }

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-950 dark:text-zinc-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editing: {course.slug}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={saving}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-emerald-500 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save & Publish"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Title</span>
            <input
              className={field}
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Subtitle</span>
            <input
              className={field}
              value={course.subtitle}
              onChange={(e) => setCourse({ ...course, subtitle: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Description (markdown)</span>
            <textarea
              className={`${field} min-h-40 font-mono`}
              value={course.description_md}
              onChange={(e) =>
                setCourse({ ...course, description_md: e.target.value })
              }
            />
          </label>
          <div className="flex gap-4">
            <label className="block text-sm">
              <span className="font-medium">Level</span>
              <select
                className={field}
                value={course.level}
                onChange={(e) => setCourse({ ...course, level: e.target.value })}
              >
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Status</span>
              <select
                className={field}
                value={course.status}
                onChange={(e) => setCourse({ ...course, status: e.target.value })}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>

          {course.modules.map((m) => (
            <div
              key={m.module_id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="font-medium">{m.title}</p>
              {m.lessons.map((l) => (
                <div
                  key={l.id}
                  className="mt-3 grid gap-2 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900 sm:grid-cols-2"
                >
                  <label className="sm:col-span-2">
                    <span className="text-xs text-zinc-500">Lesson title</span>
                    <input
                      className={field}
                      value={l.title}
                      onChange={(e) => patchLesson(l.id, { title: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className="text-xs text-zinc-500">
                      YouTube URL or video ID
                    </span>
                    <input
                      className={field}
                      value={l.video_id ?? ""}
                      onChange={(e) =>
                        patchLesson(l.id, { video_id: e.target.value || null })
                      }
                    />
                  </label>
                  <div className="flex items-end gap-3">
                    <label className="flex-1">
                      <span className="text-xs text-zinc-500">Start (s)</span>
                      <input
                        className={field}
                        value={l.video_params.start ?? ""}
                        onChange={(e) => {
                          const p = { ...l.video_params };
                          if (e.target.value) p.start = e.target.value;
                          else delete p.start;
                          patchLesson(l.id, { video_params: p });
                        }}
                      />
                    </label>
                    <label className="flex-1">
                      <span className="text-xs text-zinc-500">End (s)</span>
                      <input
                        className={field}
                        value={l.video_params.end ?? ""}
                        onChange={(e) => {
                          const p = { ...l.video_params };
                          if (e.target.value) p.end = e.target.value;
                          else delete p.end;
                          patchLesson(l.id, { video_params: p });
                        }}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 pb-2 text-xs">
                      <input
                        type="checkbox"
                        checked={l.free_preview}
                        onChange={(e) =>
                          patchLesson(l.id, { free_preview: e.target.checked })
                        }
                      />
                      Free preview
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
