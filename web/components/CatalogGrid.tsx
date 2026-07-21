"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CourseCard } from "@/lib/types";
import { isNew } from "@/lib/catalog";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm border transition-colors ${
        active
          ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}

export default function CatalogGrid({ courses }: { courses: CourseCard[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses)
      for (const cat of c.categories) map.set(cat.slug, cat.name);
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [courses]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (category && !c.categories.some((x) => x.slug === category)) return false;
      if (level && c.level !== level) return false;
      if (
        needle &&
        !`${c.title} ${c.description_md}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [courses, category, level, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <Chip
            key={cat.slug}
            active={category === cat.slug}
            onClick={() => setCategory(category === cat.slug ? null : cat.slug)}
          >
            {cat.name}
          </Chip>
        ))}
        <span className="mx-2 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        {LEVELS.map((lv) => (
          <Chip
            key={lv}
            active={level === lv}
            onClick={() => setLevel(level === lv ? null : lv)}
          >
            {lv}
          </Chip>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses…"
          className="ml-auto w-56 rounded-full border border-zinc-300 px-4 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => (
          <Link
            key={c.slug}
            href={`/courses/${c.slug}`}
            className="group flex flex-col rounded-2xl border border-zinc-200 p-6 transition-shadow hover:shadow-lg dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {isNew(c.published_at) && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  NEW
                </span>
              )}
              {c.categories.map((cat) => (
                <span
                  key={cat.slug}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {cat.name}
                </span>
              ))}
            </div>
            <h2 className="mt-3 text-lg font-semibold leading-snug group-hover:underline">
              {c.title}
            </h2>
            <p className="mt-2 line-clamp-4 text-sm text-zinc-600 dark:text-zinc-400">
              {c.description_md.split("\n\n")[0]}
            </p>
            <div className="mt-auto flex items-center gap-3 pt-4 text-sm text-zinc-500">
              <span>{c.instructors.map((i) => i.name).join(", ")}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
              <span className="capitalize">{c.level}</span>
              <span>·</span>
              <span>{c.lesson_count} lessons</span>
              <span>·</span>
              <span>{c.enrolled_count} enrolled</span>
              {c.avg_rating !== null && (
                <>
                  <span>·</span>
                  <span>★ {c.avg_rating.toFixed(1)}</span>
                </>
              )}
            </div>
          </Link>
        ))}
        {visible.length === 0 && (
          <p className="text-zinc-500">No courses match. Clear a filter and try again.</p>
        )}
      </div>
    </div>
  );
}
