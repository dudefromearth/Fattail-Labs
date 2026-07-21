import type { Metadata } from "next";
import CatalogGrid from "@/components/CatalogGrid";
import { fetchCourses } from "@/lib/catalog";

// Public entry point (spec §4.1/§5.1): statically generated at publish/build time.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Courses & Tutorials",
  description:
    "The FatTail Labs course library: capital preservation, defined-risk structures, 0-DTE, and the routines that hold a trading practice together.",
};

export default async function CoursesPage() {
  const courses = await fetchCourses();
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
    </main>
  );
}
