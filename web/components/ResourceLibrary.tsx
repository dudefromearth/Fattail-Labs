"use client";

// Resources hub — member browse (published) + admin create/version/publish.
// R6: first-class resources only (single source of truth).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { del, patchJSON, postJSON, uploadMedia } from "@/lib/client";
import { FIELD } from "@/lib/ui";
import { appAlert, appConfirm } from "@/lib/dialogs";

type CourseRef = { slug: string; title: string };

type Resource = {
  source?: "resource" | "attachment";
  id: number;
  slug?: string | null;
  title: string;
  kind: string;
  type?: string;
  free: boolean;
  description_md: string | null;
  emoji: string | null;
  url: string | null;
  version?: number | null;
  version_id?: number;
  download_path?: string;
  course?: CourseRef | null;
  courses?: CourseRef[];
  categories: { slug: string; name: string }[];
  /** Admin list: published to hub? */
  published?: boolean;
  published_version?: number | null;
};

const EMOJI_CHOICES = ["📄", "📊", "📈", "🧮", "🎥", "🔗", "📚", "🧠", "✅", "⚡"];
const TYPES = ["spreadsheet", "document", "image", "link", "other"] as const;

function defaultEmoji(r: Resource): string {
  if (r.emoji) return r.emoji;
  if (r.kind === "link" || r.type === "link") return "🔗";
  if (r.type === "spreadsheet") return "📊";
  if (r.type === "image") return "🖼";
  return "📄";
}

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
          type="button"
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

/** First-class resource create (default unpublished to hub). */
function AdminResourceForm({ onChanged }: { onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<"link" | "file">("link");
  const [type, setType] = useState<string>("document");
  const [category, setCategory] = useState("");
  const [publish, setPublish] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function uploadFile(f: File) {
    setUploading(true);
    const stored = await uploadMedia(f, { privateTier: true });
    setUploading(false);
    if (stored) {
      setUrl(stored);
      setKind("file");
      if (f.name.match(/\.(xlsx?|csv)$/i)) setType("spreadsheet");
      else if (f.name.match(/\.(png|jpe?g|webp|gif)$/i)) setType("image");
      else setType("document");
    }
  }

  async function create() {
    if (!title.trim() || !url.trim()) return;
    setBusy(true);
    const r = await postJSON("/api/admin/resources", {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description_md: description.trim() || "",
      type: type === "link" ? "link" : type,
      category_slug: category.trim() || "",
      kind,
      url: url.trim(),
      emoji: emoji.trim() || null,
      publish,
    });
    setBusy(false);
    if (r.ok) {
      setTitle("");
      setSlug("");
      setDescription("");
      setEmoji("");
      setUrl("");
      setPublish(false);
      onChanged();
    } else await appAlert({ title: "Create failed", message: await r.text() });
  }

  const field = FIELD;

  return (
    <div className="surface-card mb-6 border border-[var(--color-separator)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
        New resource (admin)
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Creates a first-class library resource. Leave unpublished to keep it course-only until you publish.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`${field} w-48`}
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (optional)"
          className={`${field} w-40`}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={field}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="category slug"
          className={`${field} w-36`}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
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
              if (f) void uploadFile(f);
            }}
          />
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          Publish to hub
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className={`${field} min-w-64 flex-1`}
        />
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy || !title.trim() || !url.trim()}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
}

function ResourceAdminPanel({
  r,
  onDone,
}: {
  r: Resource;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(r.title);
  const [description, setDescription] = useState(r.description_md ?? "");
  const [emoji, setEmoji] = useState(r.emoji ?? "");
  const [newUrl, setNewUrl] = useState("");
  const [changelog, setChangelog] = useState("");
  const [publishNew, setPublishNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isModern = !!(r.slug && (r.source === "resource" || r.source == null));

  async function saveHead() {
    if (!isModern || !r.slug) return;
    setBusy(true);
    const res = await patchJSON(`/api/admin/resources/${r.slug}`, {
      title: title.trim() || r.title,
      description_md: description.trim() || "",
      emoji: emoji.trim() || null,
    });
    setBusy(false);
    if (res.ok) {
      onDone();
      return;
    }
    let message = await res.text();
    try {
      const j = JSON.parse(message) as {
        detail?: { message?: string; code?: string } | string;
      };
      const d = j.detail;
      if (typeof d === "object" && d?.message) message = d.message;
      else if (typeof d === "string") message = d;
    } catch {
      /* plain */
    }
    await appAlert({
      title: res.status === 409 ? "Name already in use" : "Save failed",
      message,
    });
  }

  async function addVersion() {
    if (!isModern || !r.slug || !newUrl.trim()) return;
    setBusy(true);
    const kind = newUrl.startsWith("private:") || newUrl.startsWith("/api/") ? "file" : "link";
    const res = await postJSON(`/api/admin/resources/${r.slug}/versions`, {
      kind,
      url: newUrl.trim(),
      changelog_md: changelog.trim() || null,
      publish: publishNew,
    });
    setBusy(false);
    if (res.ok) {
      setNewUrl("");
      setChangelog("");
      onDone();
    } else await appAlert({ title: "Version failed", message: await res.text() });
  }

  async function togglePublish() {
    if (!isModern || !r.slug) return;
    const published = r.version != null || r.published === true;
    // If currently on hub (has version from list), unpublish; else publish latest from detail
    if (published) {
      const res = await postJSON(`/api/admin/resources/${r.slug}/publish`, {
        version: null,
      });
      if (res.ok) onDone();
      else await appAlert({ title: "Unpublish failed", message: await res.text() });
      return;
    }
    // Need a version number — fetch admin detail
    const d = await fetch(`/api/admin/resources/${r.slug}`, {
      credentials: "same-origin",
    });
    if (!d.ok) {
      await appAlert({ title: "Load failed", message: await d.text() });
      return;
    }
    const body = await d.json();
    const versions = body.versions as { version: number }[];
    const latest = versions[versions.length - 1]?.version;
    if (latest == null) return;
    const res = await postJSON(`/api/admin/resources/${r.slug}/publish`, {
      version: latest,
    });
    if (res.ok) onDone();
    else await appAlert({ title: "Publish failed", message: await res.text() });
  }

  async function destroy() {
    if (!isModern || !r.slug) return;
    const courseNote =
      r.courses && r.courses.length
        ? ` It will also be unlinked from ${r.courses.length} course(s).`
        : "";
    if (
      !(await appConfirm({
        title: `Delete “${r.title}”?`,
        message:
          "Permanently removes this resource, all versions, and every course link." +
          courseNote +
          " This cannot be undone.",
        confirmLabel: "Delete forever",
        destructive: true,
      }))
    ) {
      return;
    }
    setBusy(true);
    const res = await del(`/api/admin/resources/${r.slug}`);
    setBusy(false);
    if (res.ok) onDone();
    else await appAlert({ title: "Delete failed", message: await res.text() });
  }

  if (!isModern) {
    return (
      <p className="text-xs text-zinc-500">
        Unexpected non-resource row. Re-run attachment migration or recreate as a resource.
      </p>
    );
  }

  const onHub = r.version != null || r.published === true;

  return (
    <div className="min-w-0 flex-1 space-y-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`w-full ${FIELD}`}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className={`w-full resize-y ${FIELD}`}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void saveHead()}
          disabled={busy}
          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white"
        >
          Save details
        </button>
        <button
          type="button"
          onClick={() => void togglePublish()}
          disabled={busy}
          className="chip text-xs"
        >
          {onHub ? "Unpublish from hub" : "Publish to hub"}
        </button>
        <button
          type="button"
          onClick={() => void destroy()}
          disabled={busy}
          className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Delete resource
        </button>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        New version
      </p>
      <input
        value={newUrl}
        onChange={(e) => setNewUrl(e.target.value)}
        placeholder="New file URL or link"
        className={`w-full ${FIELD}`}
      />
      <label className={`inline-flex cursor-pointer items-center gap-1 text-xs ${FIELD}`}>
        {uploading ? "Uploading…" : "Upload file"}
        <input
          type="file"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setUploading(true);
            const stored = await uploadMedia(f, { privateTier: true });
            setUploading(false);
            if (stored) setNewUrl(stored);
          }}
        />
      </label>
      <input
        value={changelog}
        onChange={(e) => setChangelog(e.target.value)}
        placeholder="Changelog (what changed)"
        className={`w-full ${FIELD}`}
      />
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={publishNew}
          onChange={(e) => setPublishNew(e.target.checked)}
        />
        Publish this version now
      </label>
      <button
        type="button"
        onClick={() => void addVersion()}
        disabled={busy || !newUrl.trim()}
        className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Create version
      </button>
    </div>
  );
}

export default function ResourceLibrary() {
  const [resources, setResources] = useState<Resource[] | null | "anonymous">(null);
  const [category, setCategory] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const isAdmin = useIsAdmin();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    // Members: published hub only. Admins: full library (incl. unpublished).
    const url = isAdmin ? "/api/admin/resources" : "/api/resources";
    fetch(url, { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) return "anonymous" as const;
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (cancelled || d === null) return;
        if (d === "anonymous") {
          setResources("anonymous");
          return;
        }
        const rows = (d.resources || []) as Record<string, unknown>[];
        // Normalize admin list shape to the member Resource card model.
        const mapped: Resource[] = rows.map((raw) => {
          if (isAdmin && raw.slug != null) {
            const published = !!raw.published;
            const courses = (raw.courses as CourseRef[] | undefined) || [];
            return {
              source: "resource",
              id: Number(raw.id),
              slug: String(raw.slug),
              title: String(raw.title || ""),
              kind: "file",
              type: String(raw.type || "other"),
              free: false,
              description_md: (raw.description_md as string | null) ?? null,
              emoji: (raw.emoji as string | null) ?? null,
              url: null,
              version: published
                ? (raw.published_version as number | null) ?? null
                : null,
              published,
              published_version:
                (raw.published_version as number | null) ?? null,
              courses,
              categories: raw.category_slug
                ? [
                    {
                      slug: String(raw.category_slug),
                      name: String(raw.category_slug),
                    },
                  ]
                : [],
            };
          }
          return raw as unknown as Resource;
        });
        setResources(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reloadKey, isAdmin]);

  const categories = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    const map = new Map<string, string>();
    for (const r of resources)
      for (const c of r.categories || []) map.set(c.slug, c.name || c.slug);
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [resources]);

  const types = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    const s = new Set<string>();
    for (const r of resources) {
      if (r.type) s.add(r.type);
      else if (r.kind) s.add(r.kind);
    }
    return [...s].sort();
  }, [resources]);

  if (resources === null)
    return <p className="text-sm text-zinc-400">Loading…</p>;

  if (resources === "anonymous") {
    return (
      <div className="surface-card border border-[var(--color-separator)] p-8 text-center">
        <p className="font-medium">Sign in to browse the resource library</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/login" className="chip font-medium">
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
    if (category && !(r.categories || []).some((c) => c.slug === category))
      return false;
    if (typeFilter) {
      const t = r.type || r.kind;
      if (t !== typeFilter) return false;
    }
    return true;
  });

  async function download(r: Resource) {
    const path =
      r.download_path ||
      (r.source === "resource" && r.version_id
        ? `/api/resource-versions/${r.version_id}/download`
        : `/api/attachments/${r.id}/download`);
    const probe = await fetch(path, {
      method: "GET",
      credentials: "same-origin",
      redirect: "manual",
    });
    if (probe.status === 403) {
      setDenied(true);
      return;
    }
    if (probe.status === 0 || (probe.status >= 300 && probe.status < 400)) {
      const loc = probe.headers.get("location");
      if (loc) {
        window.location.href = loc;
        return;
      }
    }
    window.location.href = path;
  }

  const chip = (active: boolean) => (active ? "chip chip-active" : "chip");
  const rowKey = (r: Resource) =>
    r.source === "resource" ? `r-${r.slug || r.id}` : `a-${r.id}`;

  return (
    <div>
      {isAdmin && <AdminResourceForm onChanged={reload} />}
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
            type="button"
            onClick={() => setCategory(category === c.slug ? null : c.slug)}
            className={chip(category === c.slug)}
          >
            {c.name}
          </button>
        ))}
        {categories.length > 0 && types.length > 0 && (
          <span className="mx-2 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        )}
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            className={chip(typeFilter === t)}
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.map((r) => {
          const key = rowKey(r);
          const courses =
            r.courses && r.courses.length
              ? r.courses
              : r.course
                ? [r.course]
                : [];
          const expanded = expandedId === key;
          return (
            <li
              key={key}
              className="surface-card flex flex-col gap-2 border border-[var(--color-separator)] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800">
                  {defaultEmoji(r)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{r.title}</span>
                    {(r.version != null || r.published_version != null) && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800">
                        v{r.version ?? r.published_version}
                      </span>
                    )}
                    {isAdmin && r.published === false && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        Unpublished
                      </span>
                    )}
                    {(r.published === true ||
                      (r.source === "resource" && r.version != null)) && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        On hub
                      </span>
                    )}
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
                  <span className="mt-1 flex flex-wrap gap-1">
                    {r.slug && (r.published !== false || r.version != null) && (
                      <Link
                        href={`/resource/${r.slug}`}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800 hover:underline dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        Open page
                      </Link>
                    )}
                    {courses.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/course/${c.slug}`}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 hover:underline dark:bg-zinc-800"
                      >
                        {c.title}
                      </Link>
                    ))}
                  </span>
                  {isAdmin && (
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : key)}
                        className="text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {expanded ? "Hide admin" : "Manage"}
                      </button>
                      {r.slug && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              !(await appConfirm({
                                title: `Delete “${r.title}”?`,
                                message:
                                  "Permanently removes this document from the library and all courses. Cannot be undone.",
                                confirmLabel: "Delete forever",
                                destructive: true,
                              }))
                            )
                              return;
                            const res = await del(
                              `/api/admin/resources/${r.slug}`,
                            );
                            if (res.ok) reload();
                            else
                              await appAlert({
                                title: "Delete failed",
                                message: await res.text(),
                              });
                          }}
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </span>
                {(r.kind === "file" ||
                  r.download_path?.includes("resource-versions") ||
                  r.version_id != null) &&
                r.published !== false ? (
                  <button
                    type="button"
                    onClick={() => void download(r)}
                    className="shrink-0 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    Download
                  </button>
                ) : r.published === false ? (
                  <span className="shrink-0 text-xs text-zinc-400">
                    Not on hub
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void download(r)}
                    className="chip shrink-0 font-medium"
                  >
                    Open
                  </button>
                )}
              </div>
              {expanded && isAdmin && (
                <ResourceAdminPanel r={r} onDone={reload} />
              )}
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="col-span-full py-8 text-center text-sm text-zinc-500">
            {isAdmin
              ? "No resources yet — create one above, or clear filters."
              : "No resources match the filters."}
          </li>
        )}
      </ul>
    </div>
  );
}
