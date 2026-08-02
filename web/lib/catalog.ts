import { apiGet } from "./api";
import type { CourseCard, CourseDetail } from "./types";

export async function fetchCourses(): Promise<CourseCard[]> {
  const data = await apiGet<{ courses: CourseCard[] }>("/api/courses");
  return data.courses;
}

export type Category = {
  slug: string;
  name: string;
  description_md: string | null;
  course_count: number;
};

export async function fetchCategories(): Promise<Category[]> {
  const data = await apiGet<{ categories: Category[] }>("/api/categories");
  return data.categories;
}

/**
 * Course detail for catalog / lesson chrome.
 * Forwards session cookies on the server so administrators get **draft**
 * courses (needed for lesson prev/next nav while Pure Options etc. are draft).
 */
export async function fetchCourse(slug: string): Promise<CourseDetail> {
  const path = `/api/courses/${encodeURIComponent(slug)}`;
  if (typeof window === "undefined") {
    const { apiUrl, sessionCookieHeader } = await import("./api");
    const cookieHeader = await sessionCookieHeader();
    const res = await fetch(apiUrl(path), {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
    if (!res.ok) {
      throw new Error(`API ${res.status} for ${path}`);
    }
    return res.json() as Promise<CourseDetail>;
  }
  return apiGet<CourseDetail>(path);
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
