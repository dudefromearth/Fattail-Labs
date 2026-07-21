import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnrollCard from "@/components/EnrollCard";
import AdminEditBar from "@/components/edit/AdminEditBar";
import { EditProvider } from "@/components/edit/EditContext";
import { EditableSelect, EditableText } from "@/components/edit/Editable";
import { TrailerEditChip, TrailerPlayButton } from "@/components/TrailerHero";
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
    <EditProvider courseSlug={course.slug}>
    <main className="mx-auto w-full max-w-6xl px-6 py-10 pb-24">
      <AdminEditBar />
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
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white">
            <TrailerPlayButton trailer={course.trailer} title={course.title} />
            <TrailerEditChip />
            {course.hero_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.hero_image_url}
                alt=""
                className="h-56 w-full object-cover opacity-70"
              />
            )}
            <div className="p-8">
              <EditableText
                field="course.title"
                value={course.title}
                as="h1"
                className="block text-3xl font-semibold leading-tight"
              />
              <EditableText
                field="course.subtitle"
                value={course.subtitle}
                as="p"
                className="mt-2 block max-w-2xl text-zinc-300"
              />
              <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="font-semibold capitalize">
                    <EditableSelect
                      field="course.level"
                      value={course.level}
                      options={["beginner", "intermediate", "advanced"]}
                      className="capitalize"
                    />{" "}
                    Level
                  </dt>
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

        {/* Right rail — session-aware enrollment card */}
        <EnrollCard slug={course.slug} enrolledCount={course.enrolled_count} />
      </div>
    </main>
    </EditProvider>
  );
}
