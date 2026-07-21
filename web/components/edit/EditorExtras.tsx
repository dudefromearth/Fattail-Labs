"use client";

// v1.3 in-place editors: hero image chip, categories checklist, instructors
// checklist, attachments manager, admin new-course card.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEdit } from "./EditContext";

export function HeroImageChip() {
  const edit = useEdit();
  const fileRef = useRef<HTMLInputElement>(null);
  if (!edit?.editMode) return null;
  return (
    <label className="absolute left-3 top-12 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/80">
      <span className="font-medium">Hero image</span>
      <span className="rounded bg-white/10 px-2 py-1 ring-1 ring-emerald-400/60">
        {edit.heroImageUrl ? "Replace…" : "Upload…"}
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) edit.uploadHero(f);
        }}
      />
    </label>
  );
}

export function CategoriesCell({
  display,
}: {
  display: { slug: string; name: string }[];
}) {
  const edit = useEdit();
  const [all, setAll] = useState<{ slug: string; name: string }[] | null>(null);

  useEffect(() => {
    if (!edit?.editMode || all !== null) return;
    fetch("/api/admin/categories", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAll(d?.categories ?? []))
      .catch(() => {});
  }, [edit?.editMode, all]);

  if (!edit?.editMode) {
    return <>{display.map((c) => c.name).join(", ")}</>;
  }

  const current = new Set(edit.categories.map((c) => c.slug));
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {(all ?? edit.categories).map((c) => (
        <label key={c.slug} className="flex cursor-pointer items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={current.has(c.slug)}
            onChange={(e) => {
              const next = new Set(current);
              if (e.target.checked) next.add(c.slug);
              else next.delete(c.slug);
              edit.setCategories([...next]);
            }}
          />
          {c.name}
        </label>
      ))}
    </span>
  );
}

export function InstructorsEditor() {
  const edit = useEdit();
  const [all, setAll] = useState<{ id: number; name: string }[] | null>(null);

  useEffect(() => {
    if (!edit?.editMode || all !== null) return;
    fetch("/api/admin/instructors", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAll(d?.instructors ?? []))
      .catch(() => {});
  }, [edit?.editMode, all]);

  if (!edit?.editMode || all === null) return null;

  const current = new Set(edit.instructors.map((i) => i.id));
  return (
    <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Instructors
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {all.map((i) => (
          <label key={i.id} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={current.has(i.id)}
              onChange={(e) => {
                const next = new Set(current);
                if (e.target.checked) next.add(i.id);
                else next.delete(i.id);
                edit.setInstructors([...next]);
              }}
            />
            {i.name}
          </label>
        ))}
      </div>
    </div>
  );
}

export function AttachmentsEditor() {
  const edit = useEdit();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"link" | "file">("link");
  const [url, setUrl] = useState("");
  const [free, setFree] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!edit?.editMode) return null;

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

  return (
    <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Manage resources
      </p>
      <ul className="mt-2 space-y-2">
        {edit.attachments.map((a) => (
          <li key={a.id} className="flex items-center gap-2">
            <input
              defaultValue={a.title}
              onBlur={(e) => {
                if (e.target.value !== a.title)
                  edit.updateAttachment(a.id, { title: e.target.value });
              }}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span className="text-xs text-zinc-400">{a.kind}</span>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={!!a.free_preview}
                onChange={(e) =>
                  edit.updateAttachment(a.id, {
                    free_preview: e.target.checked,
                  } as unknown as Record<string, string>)
                }
              />
              Free
            </label>
            <button
              onClick={() => edit.removeAttachment(a.id)}
              className="text-zinc-400 hover:text-red-500"
              title="Delete"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-48 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL (or upload a file →)"
          className="flex-1 min-w-40 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <label className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
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
          onClick={() => {
            if (title.trim() && url.trim())
              edit.addAttachment({
                title: title.trim(),
                kind,
                url: url.trim(),
                free_preview: free,
              });
          }}
          disabled={!title.trim() || !url.trim()}
          className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function NewCourseCard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

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

  if (!isAdmin) return null;

  async function create() {
    setBusy(true);
    const title = prompt("Course title:", "New Course");
    if (title === null) {
      setBusy(false);
      return;
    }
    const r = await fetch("/api/admin/courses", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setBusy(false);
    if (r.ok) {
      const { slug } = await r.json();
      router.push(`/admin/courses/${slug}`);
    }
  }

  return (
    <button
      onClick={create}
      disabled={busy}
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
    >
      <span className="text-3xl">+</span>
      New Course
      <span className="mt-1 text-xs font-normal text-zinc-400">
        Created as draft
      </span>
    </button>
  );
}
