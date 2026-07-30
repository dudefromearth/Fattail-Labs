"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import {
  adminCreateTag,
  adminDeleteTag,
  adminListTags,
  adminMergeTags,
  adminRetireTag,
  adminUpdateTag,
  type Tag,
  type TagCategory,
} from "@/lib/tagsApi";

export default function TagsAdminPanel() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [usage, setUsage] = useState<
    { tag_id: number; assignment_count: number }[]
  >([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [mergeSource, setMergeSource] = useState<number | "">("");
  const [mergeTarget, setMergeTarget] = useState<number | "">("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await adminListTags();
      setTags(d.tags || []);
      setCategories(d.categories || []);
      setUsage(d.usage || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const countById = Object.fromEntries(
    usage.map((u) => [u.tag_id, u.assignment_count]),
  );

  async function onCreate() {
    if (!label.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await adminCreateTag({
        label: label.trim(),
        description: description.trim() || undefined,
        category_id: categoryId === "" ? null : Number(categoryId),
      });
      setLabel("");
      setDescription("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRetire(id: number) {
    setBusy(true);
    setErr(null);
    try {
      await adminRetireTag(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Retire failed");
    } finally {
      setBusy(false);
    }
  }

  async function onActivate(id: number) {
    setBusy(true);
    setErr(null);
    try {
      await adminUpdateTag(id, { status: "active" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this tag? Only allowed with zero assignments.")) return;
    setBusy(true);
    setErr(null);
    try {
      await adminDeleteTag(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function onMerge() {
    if (mergeSource === "" || mergeTarget === "") return;
    setBusy(true);
    setErr(null);
    try {
      await adminMergeTags(Number(mergeSource), Number(mergeTarget));
      setMergeSource("");
      setMergeTarget("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8" data-testid="admin-tags-panel">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-label)]">
          Tag Manager
        </h1>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          System-wide vocabulary. Admin CRUD only — members assign existing tags
          on Practice and catalog objects.
        </p>
      </div>

      {err && (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-label)]">
          Create tag
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block text-xs text-[var(--color-label-secondary)]">
            Label
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 block w-full min-w-[12rem] rounded border border-[var(--color-separator)] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--color-label-secondary)]">
            Category
            <select
              value={categoryId}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : "")
              }
              className="mt-1 block w-full min-w-[10rem] rounded border border-[var(--color-separator)] px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1 text-xs text-[var(--color-label-secondary)]">
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded border border-[var(--color-separator)] px-2 py-1.5 text-sm"
            />
          </label>
          <Button
            type="button"
            variant="primary"
            disabled={busy || !label.trim()}
            onClick={() => void onCreate()}
          >
            Create
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-label)]">
          Merge tags
        </h2>
        <p className="mb-2 text-xs text-[var(--color-label-tertiary)]">
          Assignments move from source to target; source is retired.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs">
            Source
            <select
              value={mergeSource}
              onChange={(e) =>
                setMergeSource(e.target.value ? Number(e.target.value) : "")
              }
              className="mt-1 block rounded border border-[var(--color-separator)] px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            Target
            <select
              value={mergeTarget}
              onChange={(e) =>
                setMergeTarget(e.target.value ? Number(e.target.value) : "")
              }
              className="mt-1 block rounded border border-[var(--color-separator)] px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {tags
                .filter((t) => t.status === "active")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
            </select>
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || mergeSource === "" || mergeTarget === ""}
            onClick={() => void onMerge()}
          >
            Merge
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-label)]">
          Vocabulary ({tags.length})
        </h2>
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-separator)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--color-fill)]/50 text-xs uppercase tracking-wide text-[var(--color-label-tertiary)]">
              <tr>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Uses</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-[var(--color-separator)]"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-[var(--color-label)]">
                      {t.label}
                    </div>
                    {t.description && (
                      <div className="text-xs text-[var(--color-label-tertiary)]">
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-label-secondary)]">
                    {t.category?.label || "—"}
                  </td>
                  <td className="px-3 py-2">{t.status}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {countById[t.id] ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {t.status === "active" ? (
                        <button
                          type="button"
                          className="text-xs underline"
                          disabled={busy}
                          onClick={() => void onRetire(t.id)}
                        >
                          Retire
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs underline"
                          disabled={busy}
                          onClick={() => void onActivate(t.id)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs text-red-600 underline"
                        disabled={busy}
                        onClick={() => void onDelete(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
