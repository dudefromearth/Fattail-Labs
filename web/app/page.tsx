import type { Metadata } from "next";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import HubShell from "@/components/hub/HubShell";
import {
  fetchCategories,
  fetchCourses,
  siteUrl,
  type Category,
} from "@/lib/catalog";
import { fetchHub, youtubeEmbedUrl, type HubPage } from "@/lib/hub";
import type { CourseCard } from "@/lib/types";

// SEO/AEO course hub. Header + FAQ are CMS-backed (in-place editable);
// catalog sections remain server-rendered for crawlers.
export const dynamic = "force-static";

const FLAGSHIP_SLUG = "first-stop-the-bleeding";

function descriptionLead(md: string, max = 280): string {
  const plain = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  if (lastStop > max * 0.5) return cut.slice(0, lastStop + 1).trim();
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function hubOrder(courses: CourseCard[]): CourseCard[] {
  const flagship = courses.find((c) => c.slug === FLAGSHIP_SLUG);
  if (!flagship) return courses;
  return [flagship, ...courses.filter((c) => c.slug !== FLAGSHIP_SLUG)];
}

function coursesInCategory(
  courses: CourseCard[],
  catSlug: string,
): CourseCard[] {
  return hubOrder(
    courses.filter((c) => c.categories.some((x) => x.slug === catSlug)),
  );
}

function websiteJsonLd(hub: HubPage) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FatTail Labs",
    url: siteUrl("/"),
    description: hub.description_md || hub.title,
    publisher: {
      "@type": "Organization",
      name: "FatTail Labs",
      url: siteUrl("/"),
      founder: { "@type": "Person", name: "Ernie Varitimos" },
    },
  };
}

function collectionPageJsonLd(hub: HubPage, courses: CourseCard[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: hub.title,
    url: siteUrl("/"),
    description: hub.description_md || undefined,
    isPartOf: { "@type": "WebSite", name: "FatTail Labs", url: siteUrl("/") },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: courses.length,
      itemListElement: courses.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: siteUrl(`/courses/${c.slug}`),
        description: c.subtitle || descriptionLead(c.description_md),
      })),
    },
  };
}

function itemListJsonLd(courses: CourseCard[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "FatTail Labs Courses",
    numberOfItems: courses.length,
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.title,
        description: c.subtitle || descriptionLead(c.description_md),
        url: siteUrl(`/courses/${c.slug}`),
        provider: {
          "@type": "Organization",
          name: "FatTail Labs",
          url: siteUrl("/"),
        },
      },
    })),
  };
}

function faqJsonLd(hub: HubPage) {
  if (!hub.faq_items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: hub.faq_items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: descriptionLead(f.answer_md, 500),
      },
    })),
  };
}

function videoObjectJsonLd(hub: HubPage) {
  if (!hub.intro_video_id) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: hub.intro_video_title || hub.title,
    description: hub.description_md || undefined,
    thumbnailUrl: `https://i.ytimg.com/vi/${hub.intro_video_id}/hqdefault.jpg`,
    embedUrl: youtubeEmbedUrl(hub.intro_video_id),
    contentUrl: `https://www.youtube.com/watch?v=${hub.intro_video_id}`,
    publisher: {
      "@type": "Organization",
      name: "FatTail Labs",
      url: siteUrl("/"),
    },
  };
}

function CourseCardBlock({ course }: { course: CourseCard }) {
  const isFlagship = course.slug === FLAGSHIP_SLUG;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-base font-semibold leading-snug tracking-tight">
        <Link
          href={`/courses/${course.slug}`}
          className="hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          {course.title}
        </Link>
        {isFlagship && (
          <span className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Flagship
          </span>
        )}
      </h3>
      {course.subtitle && (
        <p className="mt-1.5 text-sm font-medium leading-snug text-zinc-600 dark:text-zinc-400">
          {course.subtitle}
        </p>
      )}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {descriptionLead(course.description_md, 220)}
      </p>
      <p className="mt-3 text-xs text-zinc-500">
        {course.lesson_count} lessons · {course.level}
        {course.total_duration_seconds > 0
          ? ` · ${Math.round(course.total_duration_seconds / 60)} min`
          : ""}
        {course.instructors.length > 0
          ? ` · ${course.instructors.map((x) => x.name).join(", ")}`
          : ""}
      </p>
      <Link
        href={`/courses/${course.slug}`}
        className="mt-3 text-sm font-medium text-emerald-600 hover:underline"
      >
        Open course →
      </Link>
    </article>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const hub = await fetchHub().catch(() => null);
  const description =
    hub?.description_md?.slice(0, 300) ||
    "FatTail Labs course hub — capital preservation first.";
  return {
    title: {
      absolute: hub
        ? `FatTail Labs — ${hub.title}`
        : "FatTail Labs — Course Hub",
    },
    description,
    alternates: { canonical: siteUrl("/") },
    openGraph: {
      title: hub ? `FatTail Labs — ${hub.title}` : "FatTail Labs — Course Hub",
      description,
      url: siteUrl("/"),
      siteName: "FatTail Labs",
      type: "website",
    },
  };
}

export default async function CourseHubPage() {
  const [coursesRaw, categories, hub] = await Promise.all([
    fetchCourses().catch(() => [] as CourseCard[]),
    fetchCategories().catch(() => [] as Category[]),
    fetchHub(),
  ]);
  const courses = hubOrder(coursesRaw);
  const flagship = courses.find((c) => c.slug === FLAGSHIP_SLUG);
  const hubs = categories.filter((c) => c.course_count > 0);

  const slotted = new Set(
    hubs.flatMap((h) =>
      courses
        .filter((c) => c.categories.some((x) => x.slug === h.slug))
        .map((c) => c.slug),
    ),
  );
  const uncategorized = courses.filter((c) => !slotted.has(c.slug));

  const faqLd = faqJsonLd(hub);
  const videoLd = videoObjectJsonLd(hub);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd(hub)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageJsonLd(hub, courses)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd(courses)),
        }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      {videoLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
        />
      )}

      <HubShell hub={hub} courseCount={courses.length}>
        {flagship && (
          <section
            id="start-here"
            className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/25 sm:p-8"
            aria-labelledby="start-here-heading"
          >
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Start here — flagship course
                </p>
                <h2
                  id="start-here-heading"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  <Link
                    href={`/courses/${flagship.slug}`}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    {flagship.title}
                  </Link>
                </h2>
                {flagship.subtitle && (
                  <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {flagship.subtitle}
                  </p>
                )}
                <p className="mt-3 text-sm text-zinc-500">
                  {flagship.lesson_count} lessons · {flagship.level}
                  {flagship.instructors[0]
                    ? ` · ${flagship.instructors.map((i) => i.name).join(", ")}`
                    : ""}
                </p>
                <Link
                  href={`/courses/${flagship.slug}`}
                  className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  Open the flagship
                </Link>
              </div>
              <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                {descriptionLead(flagship.description_md, 400)}
              </p>
            </div>
          </section>
        )}

        {hubs.length > 0 && (
          <nav
            className="mt-10 flex flex-wrap gap-2"
            aria-label="Jump to category"
          >
            {hubs.map((cat) => (
              <a
                key={cat.slug}
                href={`#category-${cat.slug}`}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              >
                {cat.name}
                <span className="ml-1.5 text-zinc-400">{cat.course_count}</span>
              </a>
            ))}
          </nav>
        )}

        <div id="courses" className="mt-4 space-y-14">
          {hubs.map((cat) => {
            const inCat = coursesInCategory(courses, cat.slug);
            if (inCat.length === 0) return null;
            return (
              <section
                key={cat.slug}
                id={`category-${cat.slug}`}
                className="scroll-mt-20"
                aria-labelledby={`heading-${cat.slug}`}
              >
                <header className="max-w-3xl border-b border-zinc-200 pb-5 dark:border-zinc-800">
                  <h2
                    id={`heading-${cat.slug}`}
                    className="text-xl font-semibold tracking-tight sm:text-2xl"
                  >
                    <Link
                      href={`/courses/category/${cat.slug}`}
                      className="hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {cat.name}
                    </Link>
                  </h2>
                  <div className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 [&_p]:my-0">
                    {cat.description_md ? (
                      <Markdown>{cat.description_md}</Markdown>
                    ) : (
                      <p>
                        {cat.name} courses at FatTail Labs — part of the library
                        that starts with capital preservation and builds toward
                        defined-risk, convex structures.
                      </p>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    {inCat.length}{" "}
                    {inCat.length === 1 ? "course" : "courses"} in this category
                    ·{" "}
                    <Link
                      href={`/courses/category/${cat.slug}`}
                      className="text-emerald-600 hover:underline"
                    >
                      Category hub →
                    </Link>
                  </p>
                </header>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {inCat.map((c) => (
                    <CourseCardBlock
                      key={`${cat.slug}-${c.slug}`}
                      course={c}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {uncategorized.length > 0 && (
            <section id="category-other" className="scroll-mt-20">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Other courses
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {uncategorized.map((c) => (
                  <CourseCardBlock key={c.slug} course={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      </HubShell>

      <footer className="mt-14 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        <p>
          Related:{" "}
          <Link href="/courses" className="text-emerald-600 hover:underline">
            Interactive catalog
          </Link>
          {" · "}
          <Link href="/live" className="text-emerald-600 hover:underline">
            Live schedule
          </Link>
          {" · "}
          <Link href="/about" className="text-emerald-600 hover:underline">
            About
          </Link>
          {" · "}
          <Link href="/guide" className="text-emerald-600 hover:underline">
            User&apos;s guide
          </Link>
          {" · "}
          <Link href="/llms.txt" className="text-emerald-600 hover:underline">
            llms.txt
          </Link>
        </p>
      </footer>
    </main>
  );
}
