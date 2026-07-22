"use client";

// Global resource library (Resource Library Spec v1.2): every item carries a
// representative emoji and a description; admins edit items in place.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { del, postJSON, putJSON, uploadMedia } from "@/lib/client";
import { FIELD } from "@/lib/ui";

type Resource = {
  id: number;
  title: string;
  kind: "file" | "link";
  free: boolean;
  description_md: string | null;
  emoji: string | null;
  url: string | null;
  course: { slug: string; title: string };
  categories: { slug: string; name: string }[];
};

const EMOJI_CHOICES = ["📄", "📊", "📈", "🧮", "🎥", "🔗", "📚", "🧠", "✅", "⚡"];
const KIND_DEFAULT_EMOJI = { file: "📄", link: "🔗" } as const;

function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {EMOJI_CHOICES.map((e) => (
        <button
          key={e}
          onClick={() => onChange(e)}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-base ${
            value === e
              ? "bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-950"
              : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          }`}
        >
          {e}
        </button>
      ))}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…"
        maxLength={4}
        className="h-7 w-10 rounded-lg border border-zinc-300 bg-white text-center text-base dark:border-zinc-700 dark:bg-zinc-950"
        title="Custom emoji"
      />
    </span>
  );
}

function AdminResourceForm({ onChanged }: { onChanged: () => void }) {
  const [courses, setCourses] = useState<{ slug: string; title: string }[]>([]);
  const [courseSlug, setCourseSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");
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
    const stored = await uploadMedia(f, { privateTier: true });
    setUploading(false);
    if (stored) {
      setUrl(stored);
      setKind("file");
    }
  }

  async function create() {
    if (!courseSlug || !title.trim() || !url.trim()) return;
    const r = await postJSON(`/api/admin/courses/${courseSlug}/attachments`, {
      title: title.trim(),
      kind,
      url: url.trim(),
      free_preview: free,
      description_md: description.trim() || null,
      emoji: emoji.trim() || null,
    });
    if (r.ok) {
      setTitle("");
      setDescription("");
      setEmoji("");
      setUrl("");
      setFree(false);
      onChanged();
    } else alert(`Create failed: ${await r.text()}`);
  }

  const field = FIELD;

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
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the resource"
          className={`${field} min-w-64 flex-1`}
        />
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

// In-place item editor (spec v1.2): emoji, title, description on the row itself.
function ResourceRowEditor({
  r,
  onDone,
  onCancel,
}: {
  r: Resource;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(r.title);
  const [description, setDescription] = useState(r.description_md ?? "");
  const [emoji, setEmoji] = useState(r.emoji ?? "");
  const [busy, setBusy] = useState(false);

  const field = `w-full ${FIELD}`;

  async function save() {
    setBusy(true);
    const res = await putJSON(`/api/admin/attachments/${r.id}`, {
      title: title.trim() || r.title,
      description_md: description.trim() || null,
      emoji: emoji.trim() || null,
    });
    setBusy(false);
    if (res.ok) onDone();
    else alert(`Save failed: ${await res.text()}`);
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={field}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Short description of the resource"
        className={`${field} resize-y`}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={busy || !title.trim()}
          className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
        <button onClick={onCancel} className="text-xs text-zinc-500">
          Cancel
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
  const isAdmin = useIsAdmin();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
    await putJSON(`/api/admin/attachments/${r.id}`, { free_preview: !r.free });
    setReloadKey((k) => k + 1);
  }

  async function adminDelete(r: Resource) {
    if (!confirm(`Delete "${r.title}"?`)) return;
    await del(`/api/admin/attachments/${r.id}`);
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
            className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800">
              {r.emoji ?? KIND_DEFAULT_EMOJI[r.kind]}
            </span>
            {editingId === r.id ? (
              <ResourceRowEditor
                r={r}
                onDone={() => {
                  setEditingId(null);
                  setReloadKey((k) => k + 1);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
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
                  {r.description_md && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-600 dark:text-zinc-400">
                      {r.description_md}
                    </span>
                  )}
                  <Link
                    href={`/courses/${r.course.slug}`}
                    className="block truncate text-xs text-zinc-500 hover:underline"
                  >
                    {r.course.title}
                  </Link>
                  {isAdmin && (
                    <span className="mt-1 flex gap-3 text-xs text-zinc-400">
                      <button
                        onClick={() => setEditingId(r.id)}
                        className="hover:text-zinc-600"
                      >
                        Edit
                      </button>
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
              </>
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
