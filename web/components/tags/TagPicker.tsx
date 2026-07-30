"use client";

/**
 * Shared multi-select tag picker — existing system tags only (no create).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchObjectAssignments,
  fetchTags,
  setObjectTags,
  type Tag,
  type TagCategory,
} from "@/lib/tagsApi";

type Props = {
  objectType: string;
  objectId: number;
  disabled?: boolean;
  onError?: (msg: string | null) => void;
  className?: string;
};

export default function TagPicker({
  objectType,
  objectId,
  disabled = false,
  onError,
  className = "",
}: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [load, setLoad] = useState<"loading" | "ok" | "err">("loading");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const refresh = useCallback(async () => {
    setLoad("loading");
    onError?.(null);
    try {
      const [vocab, assigns] = await Promise.all([
        fetchTags(),
        fetchObjectAssignments(objectType, objectId),
      ]);
      setTags(vocab.tags || []);
      setCategories(vocab.categories || []);
      setSelected(new Set(assigns.map((a) => a.tag_id)));
      setLoad("ok");
    } catch (e) {
      setLoad("err");
      onError?.(e instanceof Error ? e.message : "Could not load tags");
    }
  }, [objectType, objectId, onError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Tag[]>();
    const filtered = tags.filter((t) => {
      if (!q.trim()) return true;
      const needle = q.trim().toLowerCase();
      return (
        t.label.toLowerCase().includes(needle) ||
        (t.description || "").toLowerCase().includes(needle)
      );
    });
    for (const t of filtered) {
      const key =
        t.category?.label ||
        categories.find((c) => c.id === t.category_id)?.label ||
        "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tags, categories, q]);

  async function toggle(tagId: number) {
    if (disabled || busy) return;
    const next = new Set(selected);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    setSelected(next);
    setBusy(true);
    onError?.(null);
    try {
      await setObjectTags(objectType, objectId, Array.from(next));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not save tags");
      void refresh();
    } finally {
      setBusy(false);
    }
  }

  if (load === "loading") {
    return (
      <p className="text-sm text-[var(--color-label-tertiary)]">Loading tags…</p>
    );
  }
  if (load === "err") {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]">
        Tags unavailable.{" "}
        <button type="button" className="underline" onClick={() => void refresh()}>
          Retry
        </button>
      </p>
    );
  }

  return (
    <div className={className} data-testid="tag-picker">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter tags…"
        className="mb-3 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        aria-label="Filter tags"
        disabled={disabled}
      />
      <div className="max-h-56 space-y-3 overflow-y-auto">
        {Array.from(byCategory.entries()).map(([cat, list]) => (
          <div key={cat}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              {cat}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((t) => {
                const on = selected.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled || busy}
                    title={t.description || t.label}
                    onClick={() => void toggle(t.id)}
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      on
                        ? "border-[var(--color-tint)] bg-[var(--color-tint)] text-[var(--color-on-tint)]"
                        : "border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label)] hover:bg-[var(--color-fill)]",
                    ].join(" ")}
                    data-testid={`tag-chip-${t.slug}`}
                    aria-pressed={on}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {byCategory.size === 0 && (
          <p className="text-sm text-[var(--color-label-tertiary)]">No tags match.</p>
        )}
      </div>
    </div>
  );
}
