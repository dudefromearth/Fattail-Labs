"use client";

// Global resource library (Resource Library Spec v1.0 §4).

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Resource = {
  id: number;
  title: string;
  kind: "file" | "link";
  free: boolean;
  url: string | null;
  course: { slug: string; title: string };
  categories: { slug: string; name: string }[];
};

function AdminResourceForm({ onChanged }: { onChanged: () => void }) {
  const [courses, setCourses] = useState<{ slug: string; title: string }[]>([]);
  const [courseSlug, setCourseSlug] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<"link" | "file">("link");
  const [free, setFree] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.courses) {
          setCourses(d.courses.map((c: { slug: string; title: string }) => ({ slug: c.slug, title: c.title })));
        }
      })
      .catch(() => {});
  }, []);

  async function uploadFile(f: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", f);
    const r = await fetch("/api/admin/media?private=true", {
      method: "POST",
      credentials: "same-origin",
      body: form,
    });
    setUploading(false);
    if (r.ok) {
      const d = await r.json();
      setUrl(d.url);
      setKind("file");
    }
  }

  async function create() {
    if (!courseSlug || !title.trim() || !url.trim()) return;
    const r = await fetch(`/api/admin/courses/${courseSlug}/attachments`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        kind,
        url: url.trim(),
        free_preview: free,
      }),
    });
    if (r.ok) {
      setTitle("");
      setUrl("");
      setFree(false);
      onChanged();
    } else alert(`Create failed: ${await r.text()}`);
  }

  const field =
    "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <div className="mb-6 rounded-2xl border-2 border-dashed border-emerald-300 p-5 dark:border-emerald-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
        Add a resource (admin)
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={courseSlug}
          onChange={(e) => setCourseSlug(e.target.value)}
          className={field}
        >
          <option value="">Course…</option>
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`${field} w-48`}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL (or upload →)"
          className={`${field} min-w-40 flex-1`}
        />
        <label className={`cursor-pointer ${field} text-xs`}>
          {uploading ? "Uploading…" : "Upload file"}
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={free}
            onChange={(e) => setFree(e.target.checked)}
          />
          Free
        </label>
        <button
          onClick={create}
          disabled={!courseSlug || !title.trim() || !url.trim()}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function ResourceLibrary() {
  const [resources, setResources] = useState<Resource[] | null | "anonymous">(null);
  const [category, setCategory] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => me?.role === "administrator" && setIsAdmin(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/resources", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) return "anonymous" as const;
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (cancelled || d === null) return;
        setResources(d === "anonymous" ? "anonymous" : d.resources);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const categories = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    const map = new Map<string, string>();
    for (const r of resources)
      for (const c of r.categories) map.set(c.slug, c.name);
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [resources]);

  if (resources === null)
    return <p className="text-sm text-zinc-400">Loading…</p>;

  if (resources === "anonymous") {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="font-medium">Sign in to browse the resource library</p>
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

  const visible = resources.filter((r) => {
    if (category && !r.categories.some((c) => c.slug === category)) return false;
    if (kind && r.kind !== kind) return false;
    return true;
  });

  async function download(id: number) {
    // Probe first so observers get a friendly upsell instead of a broken tab.
    const probe = await fetch(`/api/attachments/${id}/download`, {
      method: "GET",
      credentials: "same-origin",
      redirect: "manual",
    });
    if (probe.status === 403) {
      setDenied(true);
      return;
    }
    window.location.href = `/api/attachments/${id}/download`;
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm border transition-colors ${
      active
        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
        : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
    }`;

  async function adminToggleFree(r: Resource) {
    await fetch(`/api/admin/attachments/${r.id}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ free_preview: !r.free }),
    });
    setReloadKey((k) => k + 1);
  }

  async function adminDelete(r: Resource) {
    if (!confirm(`Delete "${r.title}"?`)) return;
    await fetch(`/api/admin/attachments/${r.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setReloadKey((k) => k + 1);
  }

  return (
    <div>
      {isAdmin && <AdminResourceForm onChanged={() => setReloadKey((k) => k + 1)} />}
      {denied && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          Downloads are a member benefit —{" "}
          <Link href="/membership" className="font-medium text-emerald-700 underline">
            become a member
          </Link>{" "}
          to unlock the full library.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(category === c.slug ? null : c.slug)}
            className={chip(category === c.slug)}
          >
            {c.name}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        {["file", "link"].map((k) => (
          <button
            key={k}
            onClick={() => setKind(kind === k ? null : k)}
            className={chip(kind === k)}
          >
            {k === "file" ? "Downloads" : "Links"}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
              {r.kind === "file" ? "⤓" : "↗"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium">{r.title}</span>
                {r.free ? (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    Free
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800">
                    Members
                  </span>
                )}
              </span>
              <Link
                href={`/courses/${r.course.slug}`}
                className="block truncate text-xs text-zinc-500 hover:underline"
              >
                {r.course.title}
              </Link>
              {isAdmin && (
                <span className="mt-1 flex gap-3 text-xs text-zinc-400">
                  <button onClick={() => adminToggleFree(r)} className="hover:text-zinc-600">
                    {r.free ? "Make members-only" : "Make free"}
                  </button>
                  <button onClick={() => adminDelete(r)} className="hover:text-red-500">
                    Delete
                  </button>
                </span>
              )}
            </span>
            {r.kind === "file" ? (
              <button
                onClick={() => download(r.id)}
                className="shrink-0 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Download
              </button>
            ) : (
              <a
                href={r.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium dark:border-zinc-700"
              >
                Open
              </a>
            )}
          </li>
        ))}
        {visible.length === 0 && (
          <li className="col-span-full py-8 text-center text-sm text-zinc-500">
            No resources match the filters.
          </li>
        )}
      </ul>
    </div>
  );
}
