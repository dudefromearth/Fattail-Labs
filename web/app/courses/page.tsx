import type { Metadata } from "next";
import Link from "next/link";
import CatalogGrid from "@/components/CatalogGrid";
import { fetchCategories, fetchCourses } from "@/lib/catalog";

// Public entry point (spec §4.1/§5.1): statically generated at publish/build time.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Courses & Tutorials",
  description:
    "The FatTail Labs course library: capital preservation, defined-risk structures, 0-DTE, and the routines that hold a trading practice together.",
};

export default async function CoursesPage() {
  const [courses, categories] = await Promise.all([
    fetchCourses(),
    fetchCategories().catch(() => []),
  ]);
  const hubs = categories.filter((c) => c.course_count > 0);
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Courses &amp; Tutorials
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Training in the FatTail doctrine: stop the bleeding first, then own the
          asymmetry.
        </p>
      </header>
      <div className="mt-8">
        <CatalogGrid courses={courses} />
      </div>
      {hubs.length > 0 && (
        <footer className="mt-14 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Browse by category
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hubs.map((c) => (
              <Link
                key={c.slug}
                href={`/courses/category/${c.slug}`}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </main>
  );
}
