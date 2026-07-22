// Dynamic sitemap (SEO spec v1.0 §2): the public surface, driven by the same
// API the pages render from — a course appears here the moment it publishes.

import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import { fetchCategories, fetchCourse, siteUrl } from "@/lib/catalog";
import type { CourseCard } from "@/lib/types";

export const revalidate = 3600; // refresh hourly; publish also revalidates

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await apiGet<{ courses: CourseCard[] }>("/api/courses").catch(
    () => ({ courses: [] as CourseCard[] }),
  );

  const courses: MetadataRoute.Sitemap = data.courses.map((c) => ({
    url: siteUrl(`/courses/${c.slug}`),
    lastModified: c.published_at ? new Date(c.published_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Category hub pages (SEO spec v1.2) — only non-empty hubs exist.
  const cats = await fetchCategories().catch(() => []);
  const hubs: MetadataRoute.Sitemap = cats
    .filter((c) => c.course_count > 0)
    .map((c) => ({
      url: siteUrl(`/courses/category/${c.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // Free-preview lessons are the long-tail landing pages (SEO spec v1.1).
  const details = await Promise.all(
    data.courses.map((c) => fetchCourse(c.slug).catch(() => null)),
  );
  const freeLessons: MetadataRoute.Sitemap = details
    .filter((c) => c !== null)
    .flatMap((c) =>
      c.modules.flatMap((m) =>
        m.lessons
          .filter((l) => l.free_preview)
          .map((l) => ({
            url: siteUrl(`/courses/${c.slug}/lessons/${l.slug}`),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          })),
      ),
    );

  return [
    {
      url: siteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: siteUrl("/courses"),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: siteUrl("/membership"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: siteUrl("/live"),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: siteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: siteUrl("/guide"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...hubs,
    ...courses,
    ...freeLessons,
  ];
}
