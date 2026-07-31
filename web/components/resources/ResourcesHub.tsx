"use client";

/**
 * Resources hub — Library + Tags (Tag Manager Spec v0.2 §9a).
 *
 * Sub-app chrome matches Practice: centered pill nav **above** the section title.
 * Tags tab: member read-only personal vocabulary (own usage counts).
 * Admin: lexicon management in place (same store as /admin/tags).
 */

import { useEffect, useMemo, useState } from "react";
import ResourceLibrary from "@/components/ResourceLibrary";
import TagsAdminPanel from "@/components/admin/TagsAdminPanel";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { fetchMyTags, type Tag, type TagCategory } from "@/lib/tagsApi";

type Tab = "library" | "tags";
type SortMode = "alpha" | "category" | "usage";

/** Centered sub-app nav — same pattern as PracticeSuiteNav (Spec §9a). */
export function ResourcesSubNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="flex justify-center">
      <nav
        className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
        aria-label="Resources suite"
        data-testid="resources-suite-nav"
        role="tablist"
      >
        {(
          [
            ["library", "Library"],
            ["tags", "Tags"],
          ] as const
        ).map(([id, label]) => {
          const on = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-current={on ? "page" : undefined}
              onClick={() => onChange(id)}
              className={[
                "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                on
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
              ].join(" ")}
              data-testid={`resources-hub-tab-${id}`}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function ResourcesHub({
  tab,
  onTabChange,
}: {
  /** Controlled by page when nav sits above the hub title. */
  tab: Tab;
  onTabChange: (t: Tab) => void;
}) {
  const isAdmin = useIsAdmin();
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("category");
  const [showRetired, setShowRetired] = useState(false);
  const [lexLoad, setLexLoad] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [lexErr, setLexErr] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "tags") return;
    setLexLoad("loading");
    setLexErr(null);
    fetchMyTags({ withUsage: true, includeRetired: showRetired })
      .then((d) => {
        setTags(d.tags || []);
        setCategories(d.categories || []);
        setLexLoad("ok");
      })
      .catch((e) => {
        setLexLoad("err");
        setLexErr(e instanceof Error ? e.message : "Could not load tags");
      });
  }, [tab, showRetired]);

  const catChips = useMemo(() => {
    const chips = [{ id: "all", label: "All" }];
    for (const c of categories) {
      chips.push({ id: String(c.id), label: c.label });
    }
    return chips;
  }, [categories]);

  const visible = useMemo(() => {
    let list = [...tags];
    if (catFilter !== "all") {
      const cid = Number(catFilter);
      list = list.filter((t) => t.category_id === cid);
    }
    if (sort === "alpha") {
      list.sort((a, b) => a.label.localeCompare(b.label));
    } else if (sort === "usage") {
      list.sort(
        (a, b) =>
          (b.usage_count || 0) - (a.usage_count || 0) ||
          a.label.localeCompare(b.label),
      );
    } else {
      list.sort((a, b) => {
        const ca = a.category_id || 0;
        const cb = b.category_id || 0;
        if (ca !== cb) return ca - cb;
        return a.label.localeCompare(b.label);
      });
    }
    return list;
  }, [tags, catFilter, sort]);

  const byCategory = useMemo(() => {
    if (sort !== "category") return null;
    const map = new Map<string, Tag[]>();
    for (const t of visible) {
      const key =
        t.category?.label ||
        categories.find((c) => c.id === t.category_id)?.label ||
        "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [visible, categories, sort]);

  return (
    <div data-testid="resources-hub">
      {tab === "library" && <ResourceLibrary />}

      {tab === "tags" && (
        <div data-testid="resources-tags">
          <p className="mb-4 text-sm text-[var(--color-label-secondary)]">
            Your process vocabulary — seeded from the FatTail lexicon, yours to
            extend when you label in Journal. Counts are{" "}
            <strong className="font-medium text-[var(--color-label)]">
              your
            </strong>{" "}
            usage only. No P&amp;L tracking. This surface is read-only; manage
            personal tags from Journal labeling (auto-create / adopt).
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {catChips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCatFilter(c.id)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  catFilter === c.id
                    ? "bg-[var(--color-tint)] text-[var(--color-on-tint)]"
                    : "bg-[var(--color-fill)] text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
                ].join(" ")}
                data-testid={`resources-tags-cat-${c.id}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 text-[var(--color-label-secondary)]">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1"
              >
                <option value="category">By category</option>
                <option value="alpha">Alphabetical</option>
                <option value="usage">By your usage</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[var(--color-label-secondary)]">
              <input
                type="checkbox"
                checked={showRetired}
                onChange={(e) => setShowRetired(e.target.checked)}
              />
              Show retired
            </label>
          </div>

          {lexLoad === "loading" && (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Loading tags…
            </p>
          )}
          {lexLoad === "err" && (
            <p className="text-sm text-red-600" role="alert">
              {lexErr}
            </p>
          )}
          {lexLoad === "ok" && byCategory && (
            <div className="space-y-6">
              {Array.from(byCategory.entries()).map(([cat, list]) => (
                <section key={cat}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    {cat}
                  </h3>
                  <ul className="space-y-2">
                    {list.map((t) => (
                      <TagRow key={t.id} t={t} />
                    ))}
                  </ul>
                </section>
              ))}
              {visible.length === 0 && (
                <p className="text-sm text-[var(--color-label-tertiary)]">
                  No tags in this view.
                </p>
              )}
            </div>
          )}
          {lexLoad === "ok" && !byCategory && (
            <ul className="space-y-2">
              {visible.map((t) => (
                <TagRow key={t.id} t={t} />
              ))}
              {visible.length === 0 && (
                <p className="text-sm text-[var(--color-label-tertiary)]">
                  No tags in this view.
                </p>
              )}
            </ul>
          )}

          {/* §9a.2 — admin lexicon edit in place (same store as /admin/tags) */}
          {isAdmin && (
            <section
              className="mt-10 border-t border-[var(--color-separator)] pt-8"
              data-testid="resources-tags-admin"
            >
              <h2
                className="font-semibold text-[var(--color-label)]"
                style={{ fontSize: "var(--text-headline)" }}
              >
                Lexicon (admin)
              </h2>
              <p className="mt-1 mb-4 text-sm text-[var(--color-label-secondary)]">
                Curated shared vocabulary. Changes apply immediately in every
                member picker. Material redefinition = retire + create — never
                rewrite meaning on a term members already applied.
              </p>
              <TagsAdminPanel />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TagRow({ t }: { t: Tag }) {
  return (
    <li
      className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2"
      data-testid={`resources-tag-${t.id}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-label)]">
          {t.label}
          {t.status === "retired" && (
            <span className="ml-2 text-[10px] uppercase text-[var(--color-label-tertiary)]">
              retired
            </span>
          )}
        </p>
        {t.description && (
          <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
            {t.description}
          </p>
        )}
      </div>
      <p className="shrink-0 tabular-nums text-xs text-[var(--color-label-tertiary)]">
        ×{t.usage_count ?? 0}
      </p>
    </li>
  );
}
