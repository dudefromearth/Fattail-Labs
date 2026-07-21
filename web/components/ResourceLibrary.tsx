"use client";

// Global resource library (Resource Library Spec v1.0 §4).

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Resource = {
  id: number;
  title: string;
  kind: "file" | "link";
  url: string | null;
  course: { slug: string; title: string };
  categories: { slug: string; name: string }[];
};

export default function ResourceLibrary() {
  const [resources, setResources] = useState<Resource[] | null | "anonymous">(null);
  const [category, setCategory] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/resources", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) return "anonymous" as const;
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (cancelled || d === null) return;
        setResources(d === "anonymous" ? "anonymous" : d.resources);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    const map = new Map<string, string>();
    for (const r of resources)
      for (const c of r.categories) map.set(c.slug, c.name);
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [resources]);

  if (resources === null)
    return <p className="text-sm text-zinc-400">Loading…</p>;

  if (resources === "anonymous") {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="font-medium">Sign in to browse the resource library</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const visible = resources.filter((r) => {
    if (category && !r.categories.some((c) => c.slug === category)) return false;
    if (kind && r.kind !== kind) return false;
    return true;
  });

  async function download(id: number) {
    // Probe first so observers get a friendly upsell instead of a broken tab.
    const probe = await fetch(`/api/attachments/${id}/download`, {
      method: "GET",
      credentials: "same-origin",
      redirect: "manual",
    });
    if (probe.status === 403) {
      setDenied(true);
      return;
    }
    window.location.href = `/api/attachments/${id}/download`;
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm border transition-colors ${
      active
        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
        : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
    }`;

  return (
    <div>
      {denied && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          Downloads are a member benefit —{" "}
          <Link href="/signup" className="font-medium text-emerald-700 underline">
            become a member
          </Link>{" "}
          to unlock the full library.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(category === c.slug ? null : c.slug)}
            className={chip(category === c.slug)}
          >
            {c.name}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        {["file", "link"].map((k) => (
          <button
            key={k}
            onClick={() => setKind(kind === k ? null : k)}
            className={chip(kind === k)}
          >
            {k === "file" ? "Downloads" : "Links"}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
              {r.kind === "file" ? "⤓" : "↗"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{r.title}</span>
              <Link
                href={`/courses/${r.course.slug}`}
                className="block truncate text-xs text-zinc-500 hover:underline"
              >
                {r.course.title}
              </Link>
            </span>
            {r.kind === "file" ? (
              <button
                onClick={() => download(r.id)}
                className="shrink-0 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Download
              </button>
            ) : (
              <a
                href={r.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium dark:border-zinc-700"
              >
                Open
              </a>
            )}
          </li>
        ))}
        {visible.length === 0 && (
          <li className="col-span-full py-8 text-center text-sm text-zinc-500">
            No resources match the filters.
          </li>
        )}
      </ul>
    </div>
  );
}
