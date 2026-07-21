"use client";

// Udemy-model catalog: attractive banner cards with the essentials; hovering a
// card raises an expansive info panel (outcomes, meta, CTA). Panel is desktop-
// only (hover devices); touch users tap straight through to the course page.

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CourseCard } from "@/lib/types";
import { isNew } from "@/lib/catalog";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

// Deterministic banner art per category (until hero images are uploaded).
const BANNER_GRADIENTS: Record<string, string> = {
  "0-dte": "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
  butterflies: "linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)",
  convexity: "linear-gradient(135deg, #3b0764 0%, #a855f7 100%)",
  "fat-tail-doctrine": "linear-gradient(135deg, #0c0a09 0%, #57534e 100%)",
  "risk-sizing": "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
  "journaling-routine": "linear-gradient(135deg, #134e4a 0%, #2dd4bf 100%)",
  "marketswarm-platform": "linear-gradient(135deg, #111827 0%, #10b981 100%)",
  "options-foundations": "linear-gradient(135deg, #1e293b 0%, #64748b 100%)",
  psychology: "linear-gradient(135deg, #4c0519 0%, #fb7185 100%)",
};
const FALLBACK_GRADIENT = "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)";

function fmtHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function updatedLabel(published_at: string | null): string | null {
  if (!published_at) return null;
  const d = new Date(published_at);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function outcomes(description_md: string): string[] {
  return description_md
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2))
    .slice(0, 3);
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-zinc-300 dark:text-zinc-700">
        {"★".repeat(5 - Math.round(rating))}
      </span>
    </span>
  );
}

function Banner({ course }: { course: CourseCard }) {
  if (course.hero_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={course.hero_image_url}
        alt=""
        loading="lazy"
        className="aspect-video w-full object-cover"
      />
    );
  }
  const cat = course.categories[0];
  return (
    <div
      className="relative flex aspect-video w-full flex-col justify-between p-4 text-white"
      style={{ background: BANNER_GRADIENTS[cat?.slug ?? ""] ?? FALLBACK_GRADIENT }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
        {cat?.name ?? "FatTail Labs"}
      </span>
      <span className="text-xl font-bold leading-snug drop-shadow-sm">
        {course.title}
      </span>
    </div>
  );
}

function HoverPanel({ course, flip }: { course: CourseCard; flip: boolean }) {
  const updated = updatedLabel(course.published_at);
  return (
    <div
      className={`invisible absolute top-0 z-30 hidden w-80 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 lg:block ${
        flip ? "right-full mr-3" : "left-full ml-3"
      }`}
    >
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-base font-bold leading-snug">{course.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {isNew(course.published_at) && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              NEW
            </span>
          )}
          {course.certification_enabled && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              Certification
            </span>
          )}
          {updated && (
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Updated {updated}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {fmtHours(course.total_duration_seconds)} total ·{" "}
          <span className="capitalize">{course.level}</span> ·{" "}
          {course.lesson_count} lessons
        </p>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          {course.subtitle}
        </p>
        <ul className="mt-3 space-y-2">
          {outcomes(course.description_md).map((o) => (
            <li key={o} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="mt-0.5 text-emerald-500">✓</span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
        <Link
          href={`/courses/${course.slug}`}
          className="mt-4 block rounded-full bg-emerald-500 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          View Course
        </Link>
      </div>
    </div>
  );
}

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

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c, i) => (
          <div key={c.slug} className="group relative">
            <Link
              href={`/courses/${c.slug}`}
              className="block overflow-hidden rounded-2xl border border-zinc-200 transition-shadow hover:shadow-lg dark:border-zinc-800"
            >
              <Banner course={c} />
              <div className="p-4">
                <h2 className="line-clamp-2 font-semibold leading-snug">
                  {c.title}
                </h2>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {c.instructors.map((x) => x.name).join(", ")}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                  {c.avg_rating !== null ? (
                    <>
                      <span className="font-semibold text-amber-700 dark:text-amber-500">
                        {c.avg_rating.toFixed(1)}
                      </span>
                      <Stars rating={c.avg_rating} />
                      <span className="text-xs text-zinc-500">
                        ({c.review_count})
                      </span>
                    </>
                  ) : isNew(c.published_at) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      NEW
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      Not yet rated
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {fmtHours(c.total_duration_seconds)} total ·{" "}
                  <span className="capitalize">{c.level}</span> ·{" "}
                  {c.lesson_count} lessons
                </p>
              </div>
            </Link>
            <HoverPanel course={c} flip={i % 3 === 2} />
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-zinc-500">No courses match. Clear a filter and try again.</p>
        )}
      </div>
    </div>
  );
}
