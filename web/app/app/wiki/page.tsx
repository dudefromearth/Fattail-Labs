"use client";

// Wiki entry surface — Interface Spec v0.1 §2 (search-first).
// Zones bound to /api/wiki/index: Start here (git pins), New this week (recent).

import Link from "next/link";
import { useEffect, useState } from "react";
import WikiSearchWidget from "@/components/wiki/WikiSearchWidget";

type IndexPage = {
  slug: string;
  title: string;
  kind: string;
  status: string;
  updated: string;
  tags: string[];
  sources: string[];
};

type IndexPayload = {
  kinds: Record<string, number>;
  start_here: IndexPage[];
  recent: IndexPage[];
  admin: boolean;
};

function oneLine(page: IndexPage): string {
  return page.tags.length > 0 ? page.tags.join(" · ") : page.kind;
}

function PageCard({ page }: { page: IndexPage }) {
  return (
    <li>
      <Link
        href={`/app/wiki/${encodeURIComponent(page.slug)}`}
        className="surface-card block border border-[var(--color-separator)] p-4 hover:border-[var(--color-tint)]"
      >
        <span className="block font-medium text-[var(--color-label)]">
          {page.title}
        </span>
        <span className="mt-1 block text-sm text-[var(--color-label-secondary)]">
          {oneLine(page)}
        </span>
      </Link>
    </li>
  );
}

export default function WikiEntryPage() {
  const [auth, setAuth] = useState<"loading" | "ok" | "anon">("loading");
  const [index, setIndex] = useState<IndexPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => {
        if (cancelled) return;
        if (r.status === 401) setAuth("anon");
        else if (r.ok) setAuth("ok");
        else setAuth("anon");
      })
      .catch(() => {
        if (!cancelled) setAuth("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wiki/index", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setIndex(data);
      })
      .catch(() => {
        if (!cancelled) setIndex(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (auth === "loading" && !index) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="text-sm text-[var(--color-label-secondary)]">Loading…</p>
      </main>
    );
  }

  const startHere = index?.start_here ?? [];
  const recent = index?.recent ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="hover:underline">
          Apps
        </Link>
        <span className="mx-2">›</span>
        <span>Wiki</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-label)]">
        Wiki
      </h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        The compiled map of everything we teach — search first, then follow the
        links into lessons and replays.
      </p>

      <div className="mt-8">
        <WikiSearchWidget />
      </div>

      {/* Zone 2 — Start here */}
      <section className="mt-12" aria-labelledby="wiki-start-heading">
        <h2
          id="wiki-start-heading"
          className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
        >
          Start here
        </h2>
        {startHere.length > 0 ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {startHere.map((p) => (
              <PageCard key={p.slug} page={p} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
            Flagship topics will land here as the corpus is compiled — capital
            preservation first, same sequencing as the pathway.
          </p>
        )}
      </section>

      {/* Zone 3 — New this week (hidden when empty, Interface §2) */}
      {recent.length > 0 && (
        <section className="mt-12" aria-labelledby="wiki-recent-heading">
          <h2
            id="wiki-recent-heading"
            className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
          >
            New this week
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {recent.map((p) => (
              <PageCard key={p.slug} page={p} />
            ))}
          </ul>
        </section>
      )}

      <p className="mt-14 text-xs text-[var(--color-label-tertiary)]">
        <Link
          href="/app/wiki/graph"
          className="text-[var(--color-tint)] hover:underline"
        >
          Explore the map
        </Link>
      </p>
    </main>
  );
}
