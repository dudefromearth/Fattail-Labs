"use client";

// Wiki article — Interface Spec v0.1 §3. Bound to /api/wiki/pages/[slug].
// Drafts and missing slugs 404 for members; anon gets the sign-in gate.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import WikiMarkdown from "@/components/wiki/WikiMarkdown";

/** Page frontmatter title is rendered as the h1 — drop a duplicate leading
 * `# Title` heading from the body so it doesn't show twice. */
function stripLeadingTitle(body: string, title: string): string {
  const lines = body.split("\n");
  const first = lines.findIndex((l) => l.trim() !== "");
  if (first !== -1 && lines[first].replace(/^#\s*/, "").trim() === title.trim()) {
    return lines.slice(first + 1).join("\n");
  }
  return body;
}

type PageLink = { slug: string; title: string; resolved?: boolean };

type WikiPage = {
  slug: string;
  title: string;
  kind: string;
  status: string;
  updated: string;
  tags: string[];
  sources: string[];
  body_md: string;
  path: string;
  backlinks: PageLink[];
  links: PageLink[];
};

type LoadState =
  | { phase: "loading" }
  | { phase: "anon" }
  | { phase: "missing" }
  | { phase: "error" }
  | { phase: "ok"; page: WikiPage };

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
    >
      {children}
    </h2>
  );
}

export default function WikiArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug || "");
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setState({ phase: "loading" });
    fetch(`/api/wiki/pages/${encodeURIComponent(slug)}`, {
      credentials: "same-origin",
    })
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 401) setState({ phase: "anon" });
        else if (r.status === 404) setState({ phase: "missing" });
        else if (r.ok) setState({ phase: "ok", page: await r.json() });
        else setState({ phase: "error" });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const crumbs = (
    <nav className="text-sm text-[var(--color-label-secondary)]">
      <Link href="/app" className="hover:underline">
        Apps
      </Link>
      <span className="mx-2">›</span>
      <Link href="/app/wiki" className="hover:underline">
        Wiki
      </Link>
      <span className="mx-2">›</span>
      <span>{state.phase === "ok" ? state.page.title : "Page"}</span>
    </nav>
  );

  if (state.phase === "loading") {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {crumbs}
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
          Loading…
        </p>
      </main>
    );
  }

  if (state.phase === "anon") {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {crumbs}
        <div className="surface-card mt-8 border border-[var(--color-separator)] p-8 text-center">
          <p className="font-medium text-[var(--color-label)]">
            Sign in to read this page
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/app/wiki/${slug}`)}`}
            className="mt-4 inline-block text-sm font-medium text-[var(--color-tint)] hover:underline"
          >
            Log in →
          </Link>
        </div>
      </main>
    );
  }

  if (state.phase === "missing" || state.phase === "error") {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {crumbs}
        <div className="surface-card mt-8 border border-[var(--color-separator)] p-8 text-center">
          <h1 className="text-xl font-semibold text-[var(--color-label)]">
            {state.phase === "missing"
              ? "Page not found"
              : "Something went wrong"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
            {state.phase === "missing"
              ? "This page does not exist or is not published yet."
              : "The page could not be loaded. Try again in a moment."}
          </p>
          <Link
            href="/app/wiki"
            className="mt-4 inline-block text-sm font-medium text-[var(--color-tint)] hover:underline"
          >
            Back to the wiki →
          </Link>
        </div>
      </main>
    );
  }

  const page = state.page;
  const unresolvedSlugs = page.links
    .filter((l) => !l.resolved)
    .map((l) => l.slug);
  const seeAlso = Array.from(
    new Map(
      page.links
        .filter((l) => l.resolved && l.slug !== page.slug)
        .map((l) => [l.slug, l]),
    ).values(),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      {crumbs}

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        {page.kind}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--color-label)]">
        {page.title}
      </h1>

      <article className="mt-8 text-[var(--color-label)]">
        <WikiMarkdown unresolvedSlugs={unresolvedSlugs}>
          {stripLeadingTitle(page.body_md, page.title)}
        </WikiMarkdown>
      </article>

      {page.sources.length > 0 && (
        <section className="mt-12" aria-labelledby="wiki-sources-heading">
          <SectionHeading id="wiki-sources-heading">
            Compiled from
          </SectionHeading>
          <ul className="mt-3 space-y-1 text-sm text-[var(--color-label-secondary)]">
            {page.sources.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {page.backlinks.length > 0 && (
        <section className="mt-10" aria-labelledby="wiki-backlinks-heading">
          <SectionHeading id="wiki-backlinks-heading">
            Linked from
          </SectionHeading>
          <ul className="mt-3 space-y-1 text-sm">
            {page.backlinks.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/app/wiki/${encodeURIComponent(b.slug)}`}
                  className="text-[var(--color-tint)] hover:underline"
                >
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {seeAlso.length > 0 && (
        <section className="mt-10" aria-labelledby="wiki-see-also-heading">
          <SectionHeading id="wiki-see-also-heading">See also</SectionHeading>
          <ul className="mt-3 space-y-1 text-sm">
            {seeAlso.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/app/wiki/${encodeURIComponent(l.slug)}`}
                  className="text-[var(--color-tint)] hover:underline"
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-xs text-[var(--color-label-tertiary)]">
        Updated {page.updated}
      </p>
    </main>
  );
}
