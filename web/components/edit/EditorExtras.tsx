"use client";

// v1.3 in-place editors: hero image chip, categories checklist, instructors
// checklist, attachments manager, admin new-course card.

import { useEffect, useRef, useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
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
  const isAdmin = useIsAdmin();
  const [busy, setBusy] = useState(false);

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
      // Open draft in edit mode via ?edit=1 (URL-backed; Exit clears it).
      router.push(`/course/${slug}?edit=1`);
    } else {
      setBusy(false);
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
        Created as draft — visible to admins only
      </span>
    </button>
  );
}

/**
 * Canonical Course Model meta fields (C6) — flagship, pathway, audience, etc.
 * Visible in edit mode only; saves via EditContext dirty map → PUT course.
 */
export function CourseCanonicalMeta({
  initial,
}: {
  initial?: {
    short_description?: string;
    flagship?: boolean;
    pathway_position?: number | null;
    audience_category?: string;
    estimated_duration_minutes?: number | null;
    learning_outcomes?: string[];
    certification_enabled?: boolean;
  };
}) {
  const edit = useEdit();
  const [server, setServer] = useState(initial ?? null);

  useEffect(() => {
    if (!edit?.editMode || !edit) return;
    // Prefer prop; otherwise load from admin API when entering edit.
    if (initial) {
      setServer(initial);
      return;
    }
    const slug =
      typeof window !== "undefined"
        ? window.location.pathname.split("/").filter(Boolean).pop()
        : "";
    if (!slug || slug === "courses") return;
    let cancelled = false;
    fetch(`/api/admin/courses/${slug}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) {
          setServer({
            short_description: d.short_description || "",
            flagship: !!d.flagship,
            pathway_position: d.pathway_position ?? null,
            audience_category: d.audience_category || "members",
            estimated_duration_minutes: d.estimated_duration_minutes ?? null,
            learning_outcomes: d.learning_outcomes || [],
            certification_enabled: !!d.certification_enabled,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [edit?.editMode, initial, edit]);

  if (!edit?.editMode) return null;

  const fb = server;
  const shortDesc = edit.value(
    "course.short_description",
    fb?.short_description || "",
  );
  const audience = edit.value(
    "course.audience_category",
    fb?.audience_category || "members",
  );
  const pathway = edit.value(
    "course.pathway_position",
    fb?.pathway_position != null ? String(fb.pathway_position) : "",
  );
  const duration = edit.value(
    "course.estimated_duration_minutes",
    fb?.estimated_duration_minutes != null
      ? String(fb.estimated_duration_minutes)
      : "",
  );
  const outcomes = edit.value(
    "course.learning_outcomes",
    (fb?.learning_outcomes || []).join("\n"),
  );
  const flagshipKey = "course.flagship";
  const flagshipOn =
    flagshipKey in edit.dirty
      ? edit.dirty[flagshipKey] === true ||
        edit.dirty[flagshipKey] === "true" ||
        edit.dirty[flagshipKey] === "1"
      : !!fb?.flagship;
  const certKey = "course.certification_enabled";
  const certOn =
    certKey in edit.dirty
      ? edit.dirty[certKey] === true ||
        edit.dirty[certKey] === "true" ||
        edit.dirty[certKey] === "1"
      : !!fb?.certification_enabled;

  return (
    <div className="surface-card space-y-3 border border-emerald-200/80 p-4 dark:border-emerald-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Course package fields
      </p>
      <label className="block text-sm">
        <span className="text-zinc-500">Short description (catalog)</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={shortDesc}
          onChange={(e) =>
            edit.setField("course.short_description", e.target.value)
          }
          onBlur={(e) =>
            void edit.commitField("course.short_description", e.target.value)
          }
        />
      </label>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={flagshipOn}
            onChange={(e) =>
              void edit.commitField(
                "course.flagship",
                e.target.checked ? "true" : "false",
              )
            }
          />
          <span>Flagship (stop-the-bleeding entry)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={certOn}
            onChange={(e) =>
              void edit.commitField(
                "course.certification_enabled",
                e.target.checked ? "true" : "false",
              )
            }
          />
          <span>Certification enabled</span>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-zinc-500">Audience</span>
          <select
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={audience}
            onChange={(e) =>
              void edit.commitField("course.audience_category", e.target.value)
            }
          >
            <option value="public">public</option>
            <option value="members">members</option>
            <option value="coaching">coaching</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Pathway position</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={pathway}
            placeholder="empty = off pathway"
            onChange={(e) =>
              edit.setField("course.pathway_position", e.target.value)
            }
            onBlur={(e) =>
              void edit.commitField("course.pathway_position", e.target.value)
            }
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Est. minutes</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={duration}
            onChange={(e) =>
              edit.setField("course.estimated_duration_minutes", e.target.value)
            }
            onBlur={(e) =>
              void edit.commitField(
                "course.estimated_duration_minutes",
                e.target.value,
              )
            }
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-zinc-500">Learning outcomes (one per line)</span>
        <textarea
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={outcomes}
          onChange={(e) =>
            edit.setField("course.learning_outcomes", e.target.value)
          }
          onBlur={(e) =>
            void edit.commitField("course.learning_outcomes", e.target.value)
          }
        />
      </label>
      <p className="text-xs text-zinc-400">
        Autosaves when you leave a field. Included in Export package.
      </p>
    </div>
  );
}

/** Import a Canonical Course package (.course.json) as a new draft. */
export function ImportCourseCard() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  async function onFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      const text = await file.text();
      const document = JSON.parse(text);
      const v = await fetch("/api/admin/canonical-courses/validate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, mode: "structural" }),
      });
      const report = await v.json();
      if (!v.ok || !report.ok) {
        const first = report.errors?.[0];
        setMsg(
          first
            ? `${first.code}: ${first.message}`
            : `Validation failed (${v.status})`,
        );
        setBusy(false);
        return;
      }
      const r = await fetch("/api/admin/canonical-courses/import", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, mode: "create_draft" }),
      });
      if (!r.ok) {
        const t = await r.text();
        setMsg(`Import failed: ${t.slice(0, 200)}`);
        setBusy(false);
        return;
      }
      const { slug } = await r.json();
      router.push(`/course/${slug}?edit=1`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Import failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="font-medium text-zinc-700 hover:text-emerald-600 disabled:opacity-50 dark:text-zinc-200"
      >
        Import package
      </button>
      <span className="mt-1 text-center text-xs text-zinc-400">
        .course.json → new draft
      </span>
      {msg && (
        <p className="mt-2 max-w-[14rem] text-center text-xs text-red-600">{msg}</p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
