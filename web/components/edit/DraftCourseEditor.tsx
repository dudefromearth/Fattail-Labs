"use client";

// Draft editing route body (spec v1.3 §4): renders the course page structure
// from the ADMIN payload with edit mode active, so drafts are fully authorable
// in place before they exist publicly. Publishing (status -> published in the
// edit bar) makes the public URL live.

import Link from "next/link";
import { useEffect, useState } from "react";
import CourseTabs from "@/components/CourseTabs";
import AdminEditBar from "@/components/edit/AdminEditBar";
import { EditProvider, useEdit } from "@/components/edit/EditContext";
import { EditableSelect, EditableText } from "@/components/edit/Editable";
import { CategoriesCell, HeroImageChip } from "@/components/edit/EditorExtras";
import { TrailerEditChip } from "@/components/TrailerHero";
import DangerZone from "@/components/edit/DangerZone";
import type { CourseDetail } from "@/lib/types";

type AdminCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description_md: string;
  level: string;
  status: string;
  hero_image_url: string | null;
  categories: { slug: string; name: string }[];
  instructors: { id: number; name: string; bio_md: string | null }[];
  attachments: { id: number; title: string; kind: string; url: string; free_preview?: boolean }[];
  modules: {
    module_id: number;
    title: string;
    kind: string;
    lessons: {
      id: number;
      slug: string;
      title: string;
      kind: string;
      duration_seconds: number;
      free_preview: boolean;
    }[];
  }[];
};

function adapt(a: AdminCourse): CourseDetail {
  return {
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    description_md: a.description_md || "*No description yet — click to write one.*",
    hero_image_url: a.hero_image_url,
    level: a.level as CourseDetail["level"],
    certification_enabled: false,
    published_at: null,
    enrolled_count: 0,
    lesson_count: a.modules.reduce((n, m) => n + m.lessons.length, 0),
    total_duration_seconds: 0,
    review_count: 0,
    avg_rating: null,
    categories: a.categories,
    trailer: null,
    instructors: a.instructors.map((i) => ({
      name: i.name,
      bio_md: i.bio_md,
      avatar_url: null,
    })),
    modules: a.modules.map((m) => ({
      title: m.title,
      kind: m.kind as CourseDetail["modules"][number]["kind"],
      lessons: m.lessons.map((l) => ({
        slug: l.slug,
        title: l.title,
        kind: l.kind as CourseDetail["modules"][number]["lessons"][number]["kind"],
        duration_seconds: l.duration_seconds,
        free_preview: l.free_preview,
      })),
    })),
    attachments: a.attachments.map((x) => ({
      id: x.id,
      title: x.title,
      kind: x.kind as "file" | "link",
      free: !!x.free_preview,
      url: x.kind === "link" ? x.url : null,
    })),
  };
}

function DraftBody({ course }: { course: CourseDetail }) {
  const edit = useEdit();
  useEffect(() => {
    if (edit && !edit.editMode) edit.setEditMode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit?.isAdmin]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 pb-24">
      <AdminEditBar />
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/courses" className="hover:underline">
          All Courses
        </Link>
        <span>›</span>
        <span>{course.title}</span>
        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          DRAFT — not public
        </span>
      </nav>

      <div className="relative mt-4 overflow-hidden rounded-3xl bg-zinc-900 text-white">
        <TrailerEditChip />
        <HeroImageChip />
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
            value={course.subtitle || "Click to add a subtitle"}
            as="p"
            className="mt-2 block max-w-2xl text-zinc-300"
          />
          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 text-sm">
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
              <dt className="font-semibold">Categories</dt>
              <dd className="text-zinc-300">
                <CategoriesCell display={course.categories} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <CourseTabs course={course} />
      </div>
      <DangerZone slug={course.slug} title={course.title} status="draft" />
    </main>
  );
}

export default function DraftCourseEditor({ slug }: { slug: string }) {
  const [course, setCourse] = useState<AdminCourse | null | "denied">(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/courses/${slug}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : "denied"))
      .then((d) => {
        if (!cancelled) setCourse(d as AdminCourse | "denied");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (course === null)
    return <main className="p-10 text-sm text-zinc-400">Loading…</main>;
  if (course === "denied")
    return (
      <main className="p-10 text-center">
        <p className="font-medium">Administrators only.</p>
      </main>
    );

  return (
    <EditProvider courseSlug={slug}>
      <DraftBody course={adapt(course)} />
    </EditProvider>
  );
}
