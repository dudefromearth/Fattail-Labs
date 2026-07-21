import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/api";

// Rendered per-request: free-preview lessons are public; gated lessons show the
// members-only state until the member path (P1c) adds session-aware playback.
export const dynamic = "force-dynamic";

type LessonPayload = {
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
  const res = await fetch(
    apiUrl(`/api/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`),
    { cache: "no-store" },
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

  if (status === 401 || !lesson) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">This lesson is for members</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Join FatTail Labs to unlock every course, live session, and resource.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Join FatTail Labs
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

      {lesson.video && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-black">
          <iframe
            src={lesson.video.embed_url}
            title={lesson.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {lesson.body_md && (
        <div className="mt-8 leading-relaxed text-zinc-700 dark:text-zinc-300">
          {lesson.body_md}
        </div>
      )}

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
