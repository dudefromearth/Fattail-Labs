"use client";

// Wiki graph — Interface Spec v0.1 §5, bound to /api/wiki/graph.
// SVG map with the "All pages" list fallback below it (WI7). Over the node
// cap, only the list renders.

import Link from "next/link";
import { useEffect, useState } from "react";
import WikiGraph, {
  GRAPH_NODE_CAP,
  type GraphEdge,
  type GraphNode,
} from "@/components/wiki/WikiGraph";

type GraphPayload = { nodes: GraphNode[]; edges: GraphEdge[] };

export default function WikiGraphPage() {
  const [auth, setAuth] = useState<"loading" | "ok" | "anon">("loading");
  const [graph, setGraph] = useState<GraphPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => {
        if (!cancelled) setAuth(r.ok ? "ok" : "anon");
      })
      .catch(() => {
        if (!cancelled) setAuth("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (auth !== "ok") return;
    let cancelled = false;
    fetch("/api/wiki/graph", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { nodes: [], edges: [] }))
      .then((data) => {
        if (!cancelled) setGraph(data);
      })
      .catch(() => {
        if (!cancelled) setGraph({ nodes: [], edges: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const allPages = [...nodes].sort((a, b) => a.title.localeCompare(b.title));

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
        <span>Map</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-[var(--color-label)]">
        Explore the map
      </h1>
      <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
        Published pages as nodes, wikilinks as edges — a reading instrument, not
        an editor.
      </p>

      {auth === "anon" ? (
        <div className="surface-card mt-8 border border-[var(--color-separator)] p-8 text-center">
          <p className="font-medium text-[var(--color-label)]">Sign in to view the map</p>
          <Link
            href={`/login?next=${encodeURIComponent("/app/wiki/graph")}`}
            className="mt-4 inline-block text-sm font-medium text-[var(--color-tint)] hover:underline"
          >
            Log in →
          </Link>
        </div>
      ) : auth === "loading" || graph === null ? (
        <p className="mt-8 text-sm text-[var(--color-label-secondary)]">
          Loading…
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {nodes.length === 0 ? (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[var(--color-separator)] bg-[var(--color-surface-secondary)] text-sm text-[var(--color-label-secondary)]">
              No published pages yet — the map renders as the corpus is
              compiled.
            </div>
          ) : nodes.length > GRAPH_NODE_CAP ? (
            <p className="text-sm text-[var(--color-label-secondary)]">
              Too many pages to draw as a map — browse the list below.
            </p>
          ) : (
            <WikiGraph nodes={nodes} edges={edges} />
          )}

          {/* List fallback for a11y / no-JS (Interface §7.4) */}
          <section aria-labelledby="wiki-all-pages">
            <h2
              id="wiki-all-pages"
              className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
            >
              All pages
            </h2>
            {allPages.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
                No published pages yet. Return to{" "}
                <Link
                  href="/app/wiki"
                  className="text-[var(--color-tint)] hover:underline"
                >
                  Wiki home
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm">
                {allPages.map((n) => (
                  <li key={n.slug} className="flex items-baseline gap-3">
                    <Link
                      href={`/app/wiki/${encodeURIComponent(n.slug)}`}
                      className="text-[var(--color-tint)] hover:underline"
                    >
                      {n.title}
                    </Link>
                    <span className="text-xs uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      {n.kind}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
