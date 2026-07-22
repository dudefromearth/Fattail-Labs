import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogGrid from "@/components/CatalogGrid";
import Markdown from "@/components/Markdown";
import {
  fetchCategories,
  fetchCourses,
  siteUrl,
  type Category,
} from "@/lib/catalog";
import type { CourseCard } from "@/lib/types";

// Category hub pages (SEO spec v1.2): one prerendered keyword hub per
// category — intro copy + that category's courses. Hourly revalidation keeps
// them tracking publishes without extra plumbing.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cats = await fetchCategories().catch(() => [] as Category[]);
  return cats.filter((c) => c.course_count > 0).map((c) => ({ catSlug: c.slug }));
}

async function loadHub(catSlug: string): Promise<{
  category: Category;
  courses: CourseCard[];
} | null> {
  const [cats, courses] = await Promise.all([
    fetchCategories().catch(() => [] as Category[]),
    fetchCourses().catch(() => [] as CourseCard[]),
  ]);
  const category = cats.find((c) => c.slug === catSlug);
  if (!category) return null;
  const mine = courses.filter((c) =>
    c.categories.some((x) => x.slug === catSlug),
  );
  if (mine.length === 0) return null; // empty hubs are 404s, not thin pages
  return { category, courses: mine };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ catSlug: string }>;
}): Promise<Metadata> {
  const { catSlug } = await params;
  const hub = await loadHub(catSlug);
  if (!hub) return {};
  const description =
    hub.category.description_md?.slice(0, 300) ??
    `${hub.category.name} courses at FatTail Labs.`;
  const url = siteUrl(`/courses/category/${catSlug}`);
  return {
    title: `${hub.category.name} Courses`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${hub.category.name} Courses — FatTail Labs`,
      description,
      url,
      siteName: "FatTail Labs",
      type: "website",
    },
  };
}

function itemListJsonLd(category: Category, courses: CourseCard[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} Courses — FatTail Labs`,
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      url: siteUrl(`/courses/${c.slug}`),
    })),
  };
}

function breadcrumbJsonLd(category: Category) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Courses", item: siteUrl("/courses") },
      { "@type": "ListItem", position: 2, name: category.name },
    ],
  };
}

export default async function CategoryHubPage({
  params,
}: {
  params: Promise<{ catSlug: string }>;
}) {
  const { catSlug } = await params;
  const hub = await loadHub(catSlug);
  if (!hub) notFound();
  const { category, courses } = hub;
  const others = (await fetchCategories().catch(() => [] as Category[])).filter(
    (c) => c.slug !== catSlug && c.course_count > 0,
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd(category, courses)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(category)),
        }}
      />
      <nav className="text-sm text-zinc-500">
        <Link href="/courses" className="hover:underline">
          All Courses
        </Link>
        <span className="mx-2">›</span>
        <span>{category.name}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {category.name}
        </h1>
        {category.description_md && (
          <div className="mt-3 max-w-3xl text-zinc-600 dark:text-zinc-400">
            <Markdown>{category.description_md}</Markdown>
          </div>
        )}
        <p className="mt-2 text-sm text-zinc-500">
          {courses.length} {courses.length === 1 ? "course" : "courses"}
        </p>
      </header>

      <div className="mt-8">
        <CatalogGrid courses={courses} />
      </div>

      {others.length > 0 && (
        <footer className="mt-14 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            More categories
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {others.map((c) => (
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
