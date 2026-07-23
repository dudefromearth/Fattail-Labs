import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiGet, apiUrl } from "@/lib/api";
import { fetchCourse, siteUrl } from "@/lib/catalog";
import type { CourseDetail } from "@/lib/types";
import LessonBody from "@/components/LessonBody";
import LessonCourseNav from "@/components/LessonCourseNav";
import LessonPlayer from "@/components/LessonPlayer";
import Markdown from "@/components/Markdown";
import QuizBuilder from "@/components/QuizBuilder";
import QuizPlayer, { type PublicQuestion } from "@/components/QuizPlayer";

// Rendered per-request: sessions see the player; anonymous visitors see the
// public landing page (SEO spec v1.1) — full HTML for crawlers, video gated.
export const dynamic = "force-dynamic";

type LessonPayload = {
  progress: { last_position: number; completed: boolean };
  questions: PublicQuestion[] | null;
  slug: string;
  title: string;
  kind: string;
  duration_seconds: number;
  module_title: string;
  course_slug: string;
  course_title: string;
  body_md: string | null;
  video: {
    provider: string;
    embed_url: string;
    expires_at?: number;
    video_id?: string;
  } | null;
};

type PublicLesson = {
  slug: string;
  title: string;
  kind: string;
  duration_seconds: number;
  free_preview: boolean;
  module_title: string;
  course_slug: string;
  course_title: string;
  body_md: string | null;
};

async function fetchLesson(
  slug: string,
  lessonSlug: string,
): Promise<{ status: number; lesson: LessonPayload | null }> {
  // Forward the caller's session cookie — lesson access is session-dependent.
  const { cookies } = await import("next/headers");
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(
    apiUrl(
      `/api/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`,
    ),
    { cache: "no-store", headers: cookieHeader ? { cookie: cookieHeader } : {} },
  );
  if (!res.ok) return { status: res.status, lesson: null };
  return { status: 200, lesson: (await res.json()) as LessonPayload };
}

async function fetchPublicLesson(
  slug: string,
  lessonSlug: string,
): Promise<PublicLesson | null> {
  return apiGet<PublicLesson>(
    `/api/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}/public`,
  ).catch(() => null);
}

function describe(pub: PublicLesson): string {
  if (pub.body_md) {
    const paragraph = pub.body_md
      .split("\n\n")
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith("#"));
    if (paragraph) {
      return paragraph.replace(/[*_`[\]()#>]/g, "").slice(0, 300);
    }
  }
  return `${pub.free_preview ? "Free preview lesson" : "Lesson"} from ${pub.course_title} — ${pub.module_title}.`;
}

function minutes(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const pub = await fetchPublicLesson(slug, lessonSlug);
  if (!pub) return {};
  const description = describe(pub);
  const url = siteUrl(`/courses/${slug}/lessons/${lessonSlug}`);
  return {
    title: `${pub.title} — ${pub.course_title}`,
    description,
    alternates: { canonical: url },
    robots: pub.free_preview ? undefined : { index: false, follow: true },
    openGraph: {
      title: `${pub.title} — ${pub.course_title}`,
      description,
      url,
      siteName: "FatTail Labs",
      type: "article",
    },
  };
}

function lessonJsonLd(pub: PublicLesson) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: pub.title,
    description: describe(pub),
    learningResourceType: pub.kind === "quiz" ? "Quiz" : "Lesson",
    timeRequired: `PT${Math.max(1, Math.round(pub.duration_seconds / 60))}M`,
    isAccessibleForFree: false,
    isPartOf: {
      "@type": "Course",
      name: pub.course_title,
      url: siteUrl(`/courses/${pub.course_slug}`),
    },
    provider: { "@type": "Organization", name: "FatTail Labs" },
  };
}

function breadcrumbJsonLd(pub: PublicLesson) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Courses",
        item: siteUrl("/courses"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pub.course_title,
        item: siteUrl(`/courses/${pub.course_slug}`),
      },
      { "@type": "ListItem", position: 3, name: pub.title },
    ],
  };
}

type Nav = {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

function buildNavFromCourse(
  course: CourseDetail | null,
  lessonSlug: string,
): Nav | null {
  if (!course) return null;
  const flat = course.modules.flatMap((m) => m.lessons);
  const i = flat.findIndex((l) => l.slug === lessonSlug);
  if (i < 0) return null;
  return {
    prev: i > 0 ? { slug: flat[i - 1].slug, title: flat[i - 1].title } : null,
    next:
      i < flat.length - 1
        ? { slug: flat[i + 1].slug, title: flat[i + 1].title }
        : null,
  };
}

function NavRow({ nav, courseSlug }: { nav: Nav | null; courseSlug: string }) {
  if (!nav) return null;
  return (
    <div className="mt-8 flex items-center justify-between text-sm">
      {nav.prev ? (
        <Link
          href={`/courses/${courseSlug}/lessons/${nav.prev.slug}`}
          className="rounded-full border border-zinc-300 px-4 py-2 transition-colors hover:border-zinc-500 dark:border-zinc-700"
        >
          ← {nav.prev.title}
        </Link>
      ) : (
        <span />
      )}
      {nav.next && (
        <Link
          href={`/courses/${courseSlug}/lessons/${nav.next.slug}`}
          className="rounded-full bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {nav.next.title} →
        </Link>
      )}
    </div>
  );
}

function LessonLayout({
  course,
  currentLessonSlug,
  children,
}: {
  course: CourseDetail | null;
  currentLessonSlug: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-9">{children}</div>
        {course && (
          <aside className="lg:col-span-3">
            <LessonCourseNav
              course={course}
              currentLessonSlug={currentLessonSlug}
            />
          </aside>
        )}
      </div>
    </main>
  );
}

function AnonymousLanding({
  pub,
  nav,
  course,
}: {
  pub: PublicLesson;
  nav: Nav | null;
  course: CourseDetail | null;
}) {
  return (
    <LessonLayout course={course} currentLessonSlug={pub.slug}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lessonJsonLd(pub)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(pub)),
        }}
      />
      <nav className="text-sm text-zinc-500">
        <Link href="/courses" className="hover:underline">
          All Courses
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/courses/${pub.course_slug}`} className="hover:underline">
          {pub.course_title}
        </Link>
        <span className="mx-2">›</span>
        <span>{pub.title}</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold">{pub.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {pub.module_title} · {minutes(pub.duration_seconds)}
        {pub.free_preview && (
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            Free preview
          </span>
        )}
      </p>

      <div className="mt-6 flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-900 text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
          🔒
        </span>
        <p className="font-medium">
          {pub.free_preview
            ? "Create a free account to watch this preview"
            : "This lesson is for members"}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={pub.free_preview ? "/signup" : "/membership"}
            className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
          >
            {pub.free_preview ? "Create Free Account" : "Become a Member"}
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/30 px-6 py-2.5 font-medium transition-colors hover:border-white/60"
          >
            Log In
          </Link>
        </div>
      </div>

      {pub.body_md && (
        <div className="mt-8">
          <Markdown>{pub.body_md}</Markdown>
        </div>
      )}

      <NavRow nav={nav} courseSlug={pub.course_slug} />

      <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950">
        <p className="font-medium">
          From “{pub.course_title}” — part of FatTail Labs
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Free accounts watch preview lessons in every course. Members get every
          lesson, live sessions, and the full resource library.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-full bg-emerald-500 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-600"
        >
          Join FatTail Labs
        </Link>
      </div>
    </LessonLayout>
  );
}

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const [{ status, lesson }, course] = await Promise.all([
    fetchLesson(slug, lessonSlug),
    fetchCourse(slug).catch(() => null),
  ]);

  if (status === 404) notFound();

  const nav = buildNavFromCourse(course, lessonSlug);

  if (status === 401) {
    const pub = await fetchPublicLesson(slug, lessonSlug);
    if (!pub) notFound();
    return <AnonymousLanding pub={pub} nav={nav} course={course} />;
  }

  if (status === 403 || !lesson) {
    return (
      <LessonLayout course={course} currentLessonSlug={lessonSlug}>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-semibold">This lesson is for members</h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Your free account unlocks the previews — membership unlocks every
            lesson, live session, and resource.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/membership"
              className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Become a Member
            </Link>
            <Link
              href={`/courses/${slug}`}
              className="rounded-full border border-zinc-300 px-6 py-2.5 font-medium transition-colors hover:border-zinc-500 dark:border-zinc-700"
            >
              Back to course
            </Link>
          </div>
        </div>
      </LessonLayout>
    );
  }

  return (
    <LessonLayout course={course} currentLessonSlug={lesson.slug}>
      <nav className="text-sm text-zinc-500">
        <Link href="/courses" className="hover:underline">
          All Courses
        </Link>
        <span className="mx-2">›</span>
        <Link
          href={`/courses/${lesson.course_slug}`}
          className="hover:underline"
        >
          {lesson.course_title}
        </Link>
        <span className="mx-2">›</span>
        <span>{lesson.title}</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold">{lesson.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{lesson.module_title}</p>

      {lesson.kind === "quiz" && (
        <div className="mt-6">
          {lesson.questions && lesson.questions.length > 0 ? (
            <QuizPlayer
              courseSlug={lesson.course_slug}
              lessonSlug={lesson.slug}
              questions={lesson.questions}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              This quiz has no questions yet.
            </p>
          )}
          <QuizBuilder
            courseSlug={lesson.course_slug}
            lessonSlug={lesson.slug}
          />
        </div>
      )}

      {lesson.kind !== "quiz" && lesson.video && (
        <div className="mt-6">
          <LessonPlayer
            courseSlug={lesson.course_slug}
            lessonSlug={lesson.slug}
            embedUrl={lesson.video.embed_url}
            provider={lesson.video.provider}
            expiresAt={lesson.video.expires_at ?? null}
            title={lesson.title}
            duration={lesson.duration_seconds}
            initialPosition={lesson.progress.last_position}
            initialCompleted={lesson.progress.completed}
          />
        </div>
      )}

      <NavRow nav={nav} courseSlug={lesson.course_slug} />

      <LessonBody
        courseSlug={lesson.course_slug}
        lessonSlug={lesson.slug}
        body={lesson.body_md}
      />

      <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950">
        <p className="font-medium">Enjoying the free preview?</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Members get every lesson, live sessions, and the full resource library.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-full bg-emerald-500 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-600"
        >
          Join FatTail Labs
        </Link>
      </div>
    </LessonLayout>
  );
}
