"use client";

/**
 * Resources hub — Library (existing) + Lexicon (system tags, read-only).
 */

import { useEffect, useMemo, useState } from "react";
import ResourceLibrary from "@/components/ResourceLibrary";
import { fetchTags, type Tag, type TagCategory } from "@/lib/tagsApi";

type Tab = "library" | "lexicon";

export default function ResourcesHub() {
  const [tab, setTab] = useState<Tab>("library");
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [lexLoad, setLexLoad] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [lexErr, setLexErr] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "lexicon") return;
    if (lexLoad === "ok" || lexLoad === "loading") return;
    setLexLoad("loading");
    setLexErr(null);
    fetchTags()
      .then((d) => {
        setTags(d.tags || []);
        setCategories(d.categories || []);
        setLexLoad("ok");
      })
      .catch((e) => {
        setLexLoad("err");
        setLexErr(e instanceof Error ? e.message : "Could not load lexicon");
      });
  }, [tab, lexLoad]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const t of tags) {
      const key =
        t.category?.label ||
        categories.find((c) => c.id === t.category_id)?.label ||
        "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tags, categories]);

  return (
    <div data-testid="resources-hub">
      <div
        className="mb-6 flex gap-1 rounded-full bg-[var(--color-fill)] p-0.5"
        role="tablist"
        aria-label="Resources hub"
      >
        {(
          [
            ["library", "Library"],
            ["lexicon", "Lexicon"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={[
              "min-h-9 flex-1 rounded-full px-4 text-sm font-medium transition-colors",
              tab === id
                ? "bg-[var(--color-tint)] text-[var(--color-on-tint)] shadow-sm"
                : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
            ].join(" ")}
            data-testid={`resources-hub-tab-${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "library" && <ResourceLibrary />}

      {tab === "lexicon" && (
        <div data-testid="resources-lexicon">
          <p className="mb-4 text-sm text-[var(--color-label-secondary)]">
            Shared process vocabulary curated by FatTail. Use these labels in
            Journal and other Practice apps — you select them; you do not invent
            the system list.
          </p>
          {lexLoad === "loading" && (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Loading lexicon…
            </p>
          )}
          {lexLoad === "err" && (
            <p className="text-sm text-red-600" role="alert">
              {lexErr}{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setLexLoad("idle")}
              >
                Retry
              </button>
            </p>
          )}
          {lexLoad === "ok" && (
            <div className="space-y-6">
              {Array.from(byCategory.entries()).map(([cat, list]) => (
                <section key={cat}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    {cat}
                  </h3>
                  <ul className="space-y-2">
                    {list.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2"
                      >
                        <p className="text-sm font-medium text-[var(--color-label)]">
                          {t.label}
                        </p>
                        {t.description && (
                          <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
                            {t.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-[var(--color-label-tertiary)]">
                  No active tags yet.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
