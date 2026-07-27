"use client";

// Course builder: attach existing / create new first-class resources + pin (R3b).

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useEdit } from "./EditContext";
import { del, patchJSON, postJSON, uploadMedia } from "@/lib/client";
import { FIELD } from "@/lib/ui";
import { appAlert, appConfirm } from "@/lib/dialogs";

type CourseResource = {
  slug: string;
  title: string;
  type: string;
  emoji?: string | null;
  pinned_version: number;
  pinned_version_id: number;
  kind: string;
  free_preview: boolean;
  sort_order: number;
  library_published: boolean;
  published_version: number | null;
  download_path: string;
};

type CatalogItem = {
  id: number;
  slug: string;
  title: string;
  type: string;
  published: boolean;
  published_version: number | null;
};

const TYPES = ["spreadsheet", "document", "image", "link", "other"];

export function CourseResourcesEditor() {
  const edit = useEdit();
  const params = useParams();
  const courseSlug =
    typeof params?.slug === "string" ? params.slug : "";

  const [rows, setRows] = useState<CourseResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [versions, setVersions] = useState<Record<string, number[]>>({});

  // create form
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("document");
  const [kind, setKind] = useState<"link" | "file">("link");
  const [free, setFree] = useState(false);
  const [publish, setPublish] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!courseSlug) return;
    setLoading(true);
    const r = await fetch(`/api/admin/courses/${courseSlug}/resource`, {
      credentials: "same-origin",
    });
    setLoading(false);
    if (r.ok) {
      const d = await r.json();
      setRows(d.resources || []);
    }
  }, [courseSlug]);

  useEffect(() => {
    if (edit?.editMode) void load();
  }, [edit?.editMode, load]);

  if (!edit?.editMode) return null;

  async function openAttach() {
    setAttachOpen(true);
    const r = await fetch("/api/admin/resources", { credentials: "same-origin" });
    if (r.ok) {
      const d = await r.json();
      setCatalog(d.resources || []);
    }
  }

  async function attach(item: CatalogItem, pin?: number) {
    const body: Record<string, unknown> = {
      resource_slug: item.slug,
      free_preview: free,
    };
    if (pin != null) body.pinned_version = pin;
    else if (item.published_version != null)
      body.pinned_version = item.published_version;
    const r = await postJSON(
      `/api/admin/courses/${courseSlug}/resource`,
      body,
    );
    if (r.ok) {
      setAttachOpen(false);
      setSearch("");
      await load();
    } else await appAlert({ title: "Attach failed", message: await r.text() });
  }

  async function createNew() {
    if (!title.trim() || !url.trim()) return;
    const cr = await postJSON("/api/admin/resources", {
      title: title.trim(),
      type,
      kind,
      url: url.trim(),
      publish,
      description_md: "",
    });
    if (!cr.ok) {
      await appAlert({ title: "Create failed", message: await cr.text() });
      return;
    }
    const created = await cr.json();
    const att = await postJSON(`/api/admin/courses/${courseSlug}/resource`, {
      resource_slug: created.slug,
      pinned_version: created.version || 1,
      free_preview: free,
    });
    if (!att.ok) {
      await appAlert({ title: "Link failed", message: await att.text() });
      return;
    }
    setTitle("");
    setUrl("");
    setCreateOpen(false);
    setPublish(false);
    await load();
  }

  async function setPin(slug: string, version: number) {
    const r = await patchJSON(
      `/api/admin/courses/${courseSlug}/resource/${slug}`,
      { pinned_version: version },
    );
    if (r.ok) await load();
    else await appAlert({ title: "Pin failed", message: await r.text() });
  }

  async function setFreePreview(slug: string, free_preview: boolean) {
    const r = await patchJSON(
      `/api/admin/courses/${courseSlug}/resource/${slug}`,
      { free_preview },
    );
    if (r.ok) await load();
  }

  async function unlink(slug: string, title: string) {
    if (
      !(await appConfirm({
        title: `Unlink “${title}”?`,
        message: "The resource stays in the library; only this course link is removed.",
        confirmLabel: "Unlink",
        destructive: true,
      }))
    )
      return;
    const r = await del(
      `/api/admin/courses/${courseSlug}/resource/${slug}`,
    );
    if (r.ok) await load();
    else await appAlert({ title: "Unlink failed", message: await r.text() });
  }

  async function loadVersions(slug: string) {
    if (versions[slug]) return;
    const r = await fetch(`/api/admin/resources/${slug}`, {
      credentials: "same-origin",
    });
    if (!r.ok) return;
    const d = await r.json();
    setVersions((v) => ({
      ...v,
      [slug]: (d.versions || []).map((x: { version: number }) => x.version),
    }));
  }

  const filtered = catalog.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Course resources
        </p>
        <span className="flex gap-2">
          <button type="button" onClick={() => void openAttach()} className="chip text-xs">
            Attach existing…
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white"
          >
            New resource…
          </button>
        </span>
      </div>

      {loading && (
        <p className="mt-2 text-xs text-zinc-400">Loading…</p>
      )}

      <ul className="mt-2 space-y-2">
        {rows.map((a) => (
          <li
            key={a.slug}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <span className="min-w-0 flex-1 font-medium">{a.title}</span>
            <span className="text-[10px] text-zinc-400">{a.type}</span>
            {a.library_published ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                In library
                {a.published_version != null ? ` v${a.published_version}` : ""}
              </span>
            ) : (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">
                Course only
              </span>
            )}
            <label className="flex items-center gap-1 text-xs">
              Pin
              <select
                className="rounded border border-zinc-300 bg-white px-1 py-0.5 text-xs dark:border-zinc-600 dark:bg-zinc-900"
                value={a.pinned_version}
                onFocus={() => void loadVersions(a.slug)}
                onChange={(e) => void setPin(a.slug, Number(e.target.value))}
              >
                {(versions[a.slug] || [a.pinned_version]).map((v) => (
                  <option key={v} value={v}>
                    v{v}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={a.free_preview}
                onChange={(e) => void setFreePreview(a.slug, e.target.checked)}
              />
              Free
            </label>
            <button
              type="button"
              onClick={() => void unlink(a.slug, a.title)}
              className="text-xs text-zinc-400 hover:text-red-500"
            >
              Unlink
            </button>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="text-xs text-zinc-400">
            No resources linked. Attach from the library or create a new one.
          </li>
        )}
      </ul>

      {/* Attach modal */}
      {attachOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <p className="font-semibold">Attach existing resource</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or slug…"
              className={`mt-3 w-full ${FIELD}`}
            />
            <ul className="mt-3 max-h-64 space-y-1 overflow-auto">
              {filtered.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => void attach(c)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span>
                      <span className="font-medium">{c.title}</span>
                      <span className="ml-2 text-xs text-zinc-400">{c.slug}</span>
                    </span>
                    <span className="text-xs text-zinc-400">
                      {c.published
                        ? `Published v${c.published_version}`
                        : "Unpublished"}
                    </span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-4 text-center text-xs text-zinc-400">
                  No matches
                </li>
              )}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAttachOpen(false)}
                className="chip"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <p className="font-semibold">New resource for this course</p>
            <p className="mt-1 text-xs text-zinc-500">
              Adds to the resource library and links here (pin v1). Publish to hub is optional.
            </p>
            <div className="mt-3 space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className={`w-full ${FIELD}`}
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full ${FIELD}`}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URL or upload"
                className={`w-full ${FIELD}`}
              />
              <label className={`inline-flex cursor-pointer text-xs ${FIELD}`}>
                {uploading ? "Uploading…" : "Upload private file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setUploading(true);
                    const stored = await uploadMedia(f, { privateTier: true });
                    setUploading(false);
                    if (stored) {
                      setUrl(stored);
                      setKind("file");
                    }
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={free}
                  onChange={(e) => setFree(e.target.checked)}
                />
                Free preview (download access)
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                />
                Publish to Resources hub
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="chip"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createNew()}
                disabled={!title.trim() || !url.trim()}
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Create & link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
