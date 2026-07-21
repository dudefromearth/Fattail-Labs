import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { fetchCourse } from "@/lib/catalog";
import LessonBody from "@/components/LessonBody";
import LessonPlayer from "@/components/LessonPlayer";
import QuizBuilder from "@/components/QuizBuilder";
import QuizPlayer, { type PublicQuestion } from "@/components/QuizPlayer";

// Rendered per-request: free-preview lessons are public; gated lessons show the
// members-only state until the member path (P1c) adds session-aware playback.
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
  video: { provider: string; embed_url: string } | null;
};

async function fetchLesson(
  slug: string,
  lessonSlug: string,
): Promise<{ status: number; lesson: LessonPayload | null }> {
  // Forward the caller's session cookie — lesson access is session-dependent.
  const { cookies } = await import("next/headers");
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(
    apiUrl(`/api/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`),
    { cache: "no-store", headers: cookieHeader ? { cookie: cookieHeader } : {} },
  );
  if (!res.ok) return { status: res.status, lesson: null };
  return { status: 200, lesson: (await res.json()) as LessonPayload };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const { lesson } = await fetchLesson(slug, lessonSlug);
  return lesson ? { title: `${lesson.title} — ${lesson.course_title}` } : {};
}

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const { status, lesson } = await fetchLesson(slug, lessonSlug);

  if (status === 404) notFound();

  // Ordered lesson list for prev/next navigation (public course payload).
  let nav: {
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
  } | null = null;
  if (lesson) {
    const course = await fetchCourse(slug).catch(() => null);
    if (course) {
      const flat = course.modules.flatMap((m) => m.lessons);
      const i = flat.findIndex((l) => l.slug === lessonSlug);
      if (i >= 0) {
        nav = {
          prev: i > 0 ? { slug: flat[i - 1].slug, title: flat[i - 1].title } : null,
          next: i < flat.length - 1 ? { slug: flat[i + 1].slug, title: flat[i + 1].title } : null,
        };
      }
    }
  }

  // 401: no account/session — the preview is the reward for signing up.
  if (status === 401) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          Create a free account to watch
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Free accounts can watch preview lessons in every course. It takes
          thirty seconds.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-6 py-2.5 font-medium transition-colors hover:border-zinc-500 dark:border-zinc-700"
          >
            Log In
          </Link>
        </div>
        <p className="mt-6 text-sm">
          <Link href={`/courses/${slug}`} className="text-zinc-500 hover:underline">
            ← Back to course
          </Link>
        </p>
      </main>
    );
  }

  // 403: signed in, but this lesson needs membership.
  if (status === 403 || !lesson) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">This lesson is for members</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Your free account unlocks the previews — membership unlocks every
          lesson, live session, and resource.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/signup"
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
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/courses" className="hover:underline">
          All Courses
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/courses/${lesson.course_slug}`} className="hover:underline">
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
            title={lesson.title}
            duration={lesson.duration_seconds}
            initialPosition={lesson.progress.last_position}
            initialCompleted={lesson.progress.completed}
          />
        </div>
      )}

      {nav && (
        <div className="mt-8 flex items-center justify-between text-sm">
          {nav.prev ? (
            <Link
              href={`/courses/${lesson.course_slug}/lessons/${nav.prev.slug}`}
              className="rounded-full border border-zinc-300 px-4 py-2 transition-colors hover:border-zinc-500 dark:border-zinc-700"
            >
              ← {nav.prev.title}
            </Link>
          ) : (
            <span />
          )}
          {nav.next && (
            <Link
              href={`/courses/${lesson.course_slug}/lessons/${nav.next.slug}`}
              className="rounded-full bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {nav.next.title} →
            </Link>
          )}
        </div>
      )}

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
    </main>
  );
}
