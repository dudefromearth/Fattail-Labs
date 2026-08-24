"use client";

// Wiki search results — Interface Spec v0.1 §4, bound to /api/wiki/search.
// Grouped rendering: "pages" first; the archive group slots in alongside later.
//
// Note: fully client-side (useSearchParams). Avoid nesting Suspense with a
// permanent "Loading…" fallback — that can stick if hydration is delayed
// (seen under Turbopack + broken CSS chunk cache).

import Link from "next/link";
import { useEffect, useState } from "react";
import WikiSearchSnippet from "@/components/wiki/WikiSearchSnippet";

type SearchResult = {
  slug: string;
  title: string;
  kind: string;
  status: string;
  updated: string;
  snippet: string;
  group: string;
};

const GROUP_ORDER = ["pages"];
const GROUP_LABELS: Record<string, string> = {
  pages: "Pages",
};

function groupResults(results: SearchResult[]): [string, SearchResult[]][] {
  const groups = new Map<string, SearchResult[]>();
  for (const r of results) {
    const key = r.group || "pages";
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  const keys = Array.from(groups.keys()).sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    return (ia === -1 ? GROUP_ORDER.length : ia) - (ib === -1 ? GROUP_ORDER.length : ib);
  });
  return keys.map((k) => [k, groups.get(k) as SearchResult[]]);
}

function readQueryQ(): string {
  if (typeof window === "undefined") return "";
  return (new URLSearchParams(window.location.search).get("q") || "").trim();
}

export default function WikiSearchPage() {
  // Prefer window.location over useSearchParams so the page never suspends
  // forever under Next/Turbopack when the search-params boundary misbehaves.
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    setQ(readQueryQ());
    const onPop = () => setQ(readQueryQ());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!q) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setResults(null);
    fetch(`/api/wiki/search?q=${encodeURIComponent(q)}`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((data) => {
        if (!cancelled) setResults(data.results || []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="hover:underline">
          Apps
        </Link>
        <span className="mx-2">›</span>
        <Link href="/app/wiki" className="hover:underline">
          Wiki
        </Link>
        <span className="mx-2">›</span>
        <span>Search</span>
      </nav>

      {results === null && q && (
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
          Loading…
        </p>
      )}

      {(results !== null || !q) && (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--color-label)]">
            Search
          </h1>
          {q ? (
            <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
              Results for{" "}
              <span className="font-medium text-[var(--color-label)]">
                “{q}”
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
              Enter a query on the{" "}
              <Link
                href="/app/wiki"
                className="text-[var(--color-tint)] hover:underline"
              >
                Wiki
              </Link>{" "}
              entry page.
            </p>
          )}

          {q && results === null && (
            <p className="mt-8 text-sm text-[var(--color-label-secondary)]">
              Searching…
            </p>
          )}

          {q && results !== null && results.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-separator)] p-6 text-sm text-[var(--color-label-secondary)]">
              <p className="font-medium text-[var(--color-label)]">
                No results for “{q}”
              </p>
              <p className="mt-2">
                Try a different term, or{" "}
                <Link
                  href="/app/wiki/graph"
                  className="text-[var(--color-tint)] hover:underline"
                >
                  explore the map
                </Link>
                .
              </p>
            </div>
          )}

          {q && results !== null && results.length > 0 && (
            <div className="mt-8 space-y-8">
              {groupResults(results).map(([group, items]) => (
                <section
                  key={group}
                  aria-label={GROUP_LABELS[group] || group}
                >
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    {GROUP_LABELS[group] || group}
                  </h2>
                  <ul className="mt-3 space-y-4">
                    {items.map((r) => (
                      <li
                        key={r.slug}
                        className="surface-card border border-[var(--color-separator)] p-4"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <Link
                            href={`/app/wiki/${encodeURIComponent(r.slug)}`}
                            className="font-medium text-[var(--color-tint)] hover:underline"
                          >
                            {r.title}
                          </Link>
                          <span className="shrink-0 text-xs uppercase tracking-wide text-[var(--color-label-tertiary)]">
                            {r.kind}
                          </span>
                        </div>
                        {r.snippet && (
                          <WikiSearchSnippet text={r.snippet} query={q} />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
