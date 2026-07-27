/**
 * Public URL hierarchy (SEO namespaces).
 *
 *   /course/[course]/[module]/[lesson]
 *   /campaign/[campaign]
 *   /resource/[resource]
 *   /app/[app-name]
 *
 * Full path uniqueness: (course), (course, module), (course, module, lesson), (app).
 * Each named entity also has a stable unique numeric id (identity ≠ URL slug).
 * Backend API paths stay under /api/courses, /api/resources, /api/apps, etc.
 */

export function courseCatalogPath(): string {
  return "/course";
}

export function coursePath(slug: string): string {
  return `/course/${encodeURIComponent(slug)}`;
}

export function lessonPath(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): string {
  return `/course/${encodeURIComponent(courseSlug)}/${encodeURIComponent(moduleSlug)}/${encodeURIComponent(lessonSlug)}`;
}

export function courseCategoryPath(catSlug: string): string {
  return `/course/category/${encodeURIComponent(catSlug)}`;
}

export function resourceCatalogPath(): string {
  return "/resource";
}

export function resourcePath(slug: string): string {
  return `/resource/${encodeURIComponent(slug)}`;
}

export function appHubPath(): string {
  return "/app";
}

export function appPath(name: string): string {
  return `/app/${encodeURIComponent(name)}`;
}

export function campaignCatalogPath(): string {
  return "/campaign";
}

export function campaignPath(slug: string): string {
  return `/campaign/${encodeURIComponent(slug)}`;
}

/** API path for member lesson payload. */
export function lessonApiPath(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  publicLanding = false,
): string {
  const base = `/api/courses/${encodeURIComponent(courseSlug)}/modules/${encodeURIComponent(moduleSlug)}/lessons/${encodeURIComponent(lessonSlug)}`;
  return publicLanding ? `${base}/public` : base;
}
