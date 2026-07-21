import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminBar from "@/components/AdminBar";
import CourseTabs from "@/components/CourseTabs";
import { fetchCourse, fetchCourses, siteUrl } from "@/lib/catalog";
import type { CourseDetail } from "@/lib/types";

// One static page per published course, generated at build/publish time (spec §5.6).
// dynamicParams=true so admin edits can revalidate + regenerate on demand —
// unknown/draft slugs still 404 (API 404 -> notFound()), they just cost a render.
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const courses = await fetchCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await fetchCourse(slug).catch(() => null);
  if (!course) return {};
  const description = course.description_md.split("\n\n")[0].slice(0, 300);
  return {
    title: course.title,
    description,
    alternates: { canonical: siteUrl(`/courses/${course.slug}`) },
    openGraph: {
      title: `${course.title} — FatTail Labs`,
      description,
      url: siteUrl(`/courses/${course.slug}`),
      siteName: "FatTail Labs",
      type: "website",
      ...(course.hero_image_url ? { images: [course.hero_image_url] } : {}),
    },
  };
}

function courseJsonLd(course: CourseDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description_md.split("\n\n")[0],
    url: siteUrl(`/courses/${course.slug}`),
    ...(course.hero_image_url ? { image: course.hero_image_url } : {}),
    provider: {
      "@type": "Organization",
      name: "FatTail Labs",
      url: siteUrl("/"),
    },
    instructor: course.instructors.map((i) => ({
      "@type": "Person",
      name: i.name,
    })),
    hasCourseInstance: [{ "@type": "CourseInstance", courseMode: "Online" }],
    ...(course.avg_rating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: course.avg_rating,
            bestRating: 5,
          },
        }
      : {}),
  };
}

function breadcrumbJsonLd(course: CourseDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "All Courses",
        item: siteUrl("/courses"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: course.title,
        item: siteUrl(`/courses/${course.slug}`),
      },
    ],
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await fetchCourse(slug).catch(() => null);
  if (!course) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <AdminBar slug={course.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd(course)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(course)),
        }}
      />

      <nav className="text-sm text-zinc-500">
        <Link href="/courses" className="hover:underline">
          All Courses
        </Link>
        <span className="mx-2">›</span>
        <span>{course.title}</span>
      </nav>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* minmax(0,…) keeps text wrapping inside the column instead of widening the page */}
        <div>
          {/* Hero */}
          <div className="overflow-hidden rounded-3xl bg-zinc-900 text-white">
            {course.hero_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.hero_image_url}
                alt=""
                className="h-56 w-full object-cover opacity-70"
              />
            )}
            <div className="p-8">
              <h1 className="text-3xl font-semibold leading-tight">
                {course.title}
              </h1>
              <p className="mt-2 max-w-2xl text-zinc-300">{course.subtitle}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="font-semibold capitalize">{course.level} Level</dt>
                  <dd className="text-zinc-300">Recommended Experience</dd>
                </div>
                <div>
                  <dt className="font-semibold">
                    {course.avg_rating !== null
                      ? `${course.avg_rating.toFixed(1)} ★`
                      : "—"}
                  </dt>
                  <dd className="text-zinc-300">Rating</dd>
                </div>
                <div>
                  <dt className="font-semibold">
                    {course.modules.length} Modules
                  </dt>
                  <dd className="text-zinc-300">
                    {course.lesson_count} lessons in total
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Categories</dt>
                  <dd className="text-zinc-300">
                    {course.categories.map((c) => c.name).join(", ")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8">
            <CourseTabs course={course} />
          </div>
        </div>

        {/* Right rail */}
        <aside className="h-fit rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="font-semibold">My Progress</h2>
          <div className="mt-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          <p className="mt-2 text-sm text-zinc-500">Not started yet</p>
          <Link
            href="/signup"
            className="mt-4 block rounded-full bg-emerald-500 py-2.5 text-center font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Join to Enroll
          </Link>
          <p className="mt-3 text-center text-xs text-zinc-400">
            {course.enrolled_count} enrolled
          </p>
        </aside>
      </div>
    </main>
  );
}
