import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiGet, apiUrl, sessionCookieHeader } from "@/lib/api";
import { fetchCourse, siteUrl } from "@/lib/catalog";
import type { CourseDetail } from "@/lib/types";
import LessonBody from "@/components/LessonBody";
import LessonCourseNav from "@/components/LessonCourseNav";
import LessonMarkComplete from "@/components/LessonMarkComplete";
import LessonPlayer from "@/components/LessonPlayer";
import Markdown from "@/components/Markdown";
import QuizBuilder from "@/components/QuizBuilder";
import QuizPlayer, { type PublicQuestion } from "@/components/QuizPlayer";
import { IconLock } from "@/components/ui/icons";

// Rendered per-request: sessions see the player; anonymous visitors see the
// public landing page (SEO spec v1.1) — full HTML for crawlers, video gated.
export const dynamic = "force-dynamic";

type LessonPayload = {
  progress: { last_position: number; completed: boolean };
  questions: PublicQuestion[] | null;
  id: number;
  slug: string;
  title: string;
  kind: string;
  duration_seconds: number;
  free_preview?: boolean;
  module_slug: string;
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
  module_slug: string;
  module_title: string;
  course_slug: string;
  course_title: string;
  body_md: string | null;
};

async function fetchLesson(
  slug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<{ status: number; lesson: LessonPayload | null; error?: string }> {
  // Forward the caller's session cookie — lesson access is session-dependent.
  // Never let fetch/network failures throw: that becomes Next "couldn't load".
  try {
    const cookieHeader = await sessionCookieHeader();
    const res = await fetch(
      apiUrl(
        `/api/courses/${encodeURIComponent(slug)}/modules/${encodeURIComponent(moduleSlug)}/lessons/${encodeURIComponent(lessonSlug)}`,
      ),
      {
        cache: "no-store",
        headers: cookieHeader ? { cookie: cookieHeader } : {},
      },
    );
    if (!res.ok) {
      return {
        status: res.status,
        lesson: null,
        error: `Lesson API ${res.status}`,
      };
    }
    const lesson = (await res.json()) as LessonPayload;
    // Normalize so render never crashes on partial payloads.
    if (!lesson.progress) {
      lesson.progress = { last_position: 0, completed: false };
    }
    return { status: 200, lesson };
  } catch (e) {
    return {
      status: 503,
      lesson: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function fetchPublicLesson(
  slug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<PublicLesson | null> {
  return apiGet<PublicLesson>(
    `/api/courses/${encodeURIComponent(slug)}/modules/${encodeURIComponent(moduleSlug)}/lessons/${encodeURIComponent(lessonSlug)}/public`,
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
  params: Promise<{ slug: string; moduleSlug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, moduleSlug, lessonSlug } = await params;
  const pub = await fetchPublicLesson(slug, moduleSlug, lessonSlug);
  if (!pub) return {};
  const description = describe(pub);
  const url = siteUrl(`/course/${slug}/${moduleSlug}/${lessonSlug}`);
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
      url: siteUrl(`/course/${pub.course_slug}`),
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
        item: siteUrl("/course"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pub.course_title,
        item: siteUrl(`/course/${pub.course_slug}`),
      },
      { "@type": "ListItem", position: 3, name: pub.title },
    ],
  };
}

type NavItem = { moduleSlug: string; slug: string; title: string };
type Nav = {
  prev: NavItem | null;
  next: NavItem | null;
};

function buildNavFromCourse(
  course: CourseDetail | null,
  moduleSlug: string,
  lessonSlug: string,
): Nav | null {
  if (!course) return null;
  const flat: NavItem[] = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({
      moduleSlug: m.slug,
      slug: l.slug,
      title: l.title,
    })),
  );
  const i = flat.findIndex(
    (l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug,
  );
  if (i < 0) return null;
  return {
    prev: i > 0 ? flat[i - 1] : null,
    next: i < flat.length - 1 ? flat[i + 1] : null,
  };
}

function NavRow({ nav, courseSlug }: { nav: Nav | null; courseSlug: string }) {
  if (!nav) return null;
  return (
    <div className="mt-8 flex items-center justify-between text-sm">
      {nav.prev ? (
        <Link
          href={`/course/${courseSlug}/${nav.prev.moduleSlug}/${nav.prev.slug}`}
          className="chip"
        >
          ← {nav.prev.title}
        </Link>
      ) : (
        <span />
      )}
      {nav.next && (
        <Link
          href={`/course/${courseSlug}/${nav.next.moduleSlug}/${nav.next.slug}`}
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
        <Link href="/course" className="hover:underline">
          All Courses
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/course/${pub.course_slug}`} className="hover:underline">
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
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <IconLock size={32} tone="light" />
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
  params: Promise<{ slug: string; moduleSlug: string; lessonSlug: string }>;
}) {
  const { slug, moduleSlug, lessonSlug } = await params;
  const [{ status, lesson, error: fetchError }, course] = await Promise.all([
    fetchLesson(slug, moduleSlug, lessonSlug),
    fetchCourse(slug).catch(() => null),
  ]);

  if (status === 404) notFound();

  const nav = buildNavFromCourse(course, moduleSlug, lessonSlug);

  if (status === 401) {
    const pub = await fetchPublicLesson(slug, moduleSlug, lessonSlug);
    if (!pub) notFound();
    return <AnonymousLanding pub={pub} nav={nav} course={course} />;
  }

  // Upstream API / network failure — never surface as Next.js "couldn't load".
  if (status >= 500 || (status === 503 && !lesson)) {
    return (
      <LessonLayout course={course} currentLessonSlug={lessonSlug}>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-semibold">Lesson temporarily unavailable</h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            We couldn&apos;t load this lesson from the server. Try again in a
            moment.
          </p>
          {fetchError && (
            <p className="mt-2 font-mono text-xs text-zinc-400">{fetchError}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href={`/course/${slug}/${moduleSlug}/${lessonSlug}`}
              className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Try again
            </Link>
            <Link
              href={`/course/${slug}`}
              className="chip font-medium px-6 py-2.5"
            >
              Back to course
            </Link>
          </div>
        </div>
      </LessonLayout>
    );
  }

  if (status === 403 || !lesson) {
    return (
      <LessonLayout course={course} currentLessonSlug={lessonSlug}>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-semibold">This lesson is for members</h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Observer, Activator, Navigator, and Coaching memberships unlock
            every lesson. If you just joined via FatTail, open Courses from My
            Account again (SSO) so Labs refreshes your membership.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fcourse"
              className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Refresh membership (SSO)
            </a>
            <Link
              href="/membership"
              className="chip font-medium px-6 py-2.5"
            >
              Membership
            </Link>
            <Link
              href={`/course/${slug}`}
              className="chip font-medium px-6 py-2.5"
            >
              Back to course
            </Link>
          </div>
        </div>
      </LessonLayout>
    );
  }

  const progress = lesson.progress ?? { last_position: 0, completed: false };
  // Placement rules for Completed toggle:
  // 1) Below the video when a player is shown (handled inside LessonPlayer).
  // 2) Below the text when body_md is non-empty.
  // 3) If there is no text, the second toggle is not necessary.
  // 4) Quiz / empty / non-video with no text still need one control after primary content.
  const hasVideoPlayer =
    lesson.kind !== "quiz" && Boolean(lesson.video?.embed_url);
  const hasText = Boolean(lesson.body_md?.trim());
  const showCompleteAfterText = hasText;
  const showCompleteAfterPrimary = !hasVideoPlayer && !hasText;

  return (
    <LessonLayout course={course} currentLessonSlug={lesson.slug}>
      <nav className="text-sm text-zinc-500">
        <Link href="/course" className="hover:underline">
          All Courses
        </Link>
        <span className="mx-2">›</span>
        <Link
          href={`/course/${lesson.course_slug}`}
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
            moduleSlug={lesson.module_slug}
            lessonSlug={lesson.slug}
            lessonId={lesson.id}
          />
        </div>
      )}

      {lesson.kind !== "quiz" && lesson.video?.embed_url && (
        <div className="mt-6">
          <LessonPlayer
            courseSlug={lesson.course_slug}
            lessonSlug={lesson.slug}
            embedUrl={lesson.video.embed_url}
            provider={lesson.video.provider}
            expiresAt={lesson.video.expires_at ?? null}
            title={lesson.title}
            duration={lesson.duration_seconds}
            initialPosition={progress.last_position ?? 0}
            initialCompleted={!!progress.completed}
          />
        </div>
      )}

      {lesson.kind !== "quiz" &&
        lesson.kind !== "text" &&
        !lesson.video?.embed_url && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {lesson.kind === "download" || lesson.kind === "external"
            ? "Open resources from the course Resources tab, or add a video/link in edit mode."
            : "No video is attached to this lesson yet. In edit mode, set a YouTube URL on the Modules tab."}
        </div>
      )}

      {/* No video + no text: single control after primary (quiz / placeholder / empty). */}
      {showCompleteAfterPrimary && (
        <LessonMarkComplete
          courseSlug={lesson.course_slug}
          lessonSlug={lesson.slug}
          initialCompleted={!!progress.completed}
          placement="top"
        />
      )}

      <LessonBody
        courseSlug={lesson.course_slug}
        moduleSlug={lesson.module_slug}
        lessonSlug={lesson.slug}
        lessonId={lesson.id}
        body={lesson.body_md}
      />

      {/* Below text only when lesson notes exist. Video+text → dual (player + here). */}
      {showCompleteAfterText && (
        <LessonMarkComplete
          courseSlug={lesson.course_slug}
          lessonSlug={lesson.slug}
          initialCompleted={!!progress.completed}
          placement="bottom"
        />
      )}

      <NavRow nav={nav} courseSlug={lesson.course_slug} />

      {/* Membership CTA only on free-preview lessons (not every video page). */}
      {lesson.free_preview && (
        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="font-medium">Enjoying the free preview?</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Members get every lesson, live sessions, and the full resource library.
          </p>
          <Link
            href="/membership"
            className="mt-4 inline-block rounded-full bg-emerald-500 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Become a Member
          </Link>
        </div>
      )}
    </LessonLayout>
  );
}
