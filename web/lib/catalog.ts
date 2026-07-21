import { apiGet } from "./api";
import type { CourseCard, CourseDetail } from "./types";

export async function fetchCourses(): Promise<CourseCard[]> {
  const data = await apiGet<{ courses: CourseCard[] }>("/api/courses");
  return data.courses;
}

export async function fetchCourse(slug: string): Promise<CourseDetail> {
  return apiGet<CourseDetail>(`/api/courses/${encodeURIComponent(slug)}`);
}

export function siteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  }
  return `${base}${path}`;
}

export function isNew(published_at: string | null): boolean {
  if (!published_at) return false;
  const days = (Date.now() - new Date(published_at).getTime()) / 86_400_000;
  return days < 30;
}

export function totalDuration(detail: CourseDetail): number {
  return detail.modules
    .flatMap((m) => m.lessons)
    .reduce((s, l) => s + l.duration_seconds, 0);
}
