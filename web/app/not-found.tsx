"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DraftCourseEditor from "@/components/edit/DraftCourseEditor";

type Phase = "boot" | "loading" | "draft" | "gone";

/**
 * Global 404. For /course/{slug}: admins with a draft (or archived) course
 * get the draft editor at the public URL — no /admin bounce. Everyone else
 * sees the standard 404. Drafts stay invisible to non-admins.
 */
export default function NotFound() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/course\/([^/]+)\/?$/);
    if (!match) {
      setPhase("gone");
      return;
    }
    setPhase("loading");
    const s = decodeURIComponent(match[1]);
    let cancelled = false;
    fetch(`/api/admin/courses/${s}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((course) => {
        if (cancelled) return;
        if (course && course.status !== "published") {
          setSlug(s);
          setPhase("draft");
        } else {
          setPhase("gone");
        }
      })
      .catch(() => {
        if (!cancelled) setPhase("gone");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "draft" && slug) {
    return <DraftCourseEditor slug={slug} />;
  }

  if (phase === "boot" || phase === "loading") {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-24 text-center text-sm text-zinc-500">
        {phase === "loading" ? "Checking…" : null}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        This page doesn&apos;t exist — or isn&apos;t published yet.
      </p>
      <Link
        href="/course"
        className="mt-8 rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
      >
        Browse the courses
      </Link>
    </main>
  );
}
