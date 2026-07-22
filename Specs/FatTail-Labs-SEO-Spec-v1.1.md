# FatTail Labs — SEO Spec v1.1 (Layer 2: free-lesson landing pages)

**Status:** Approved as built (2026-07-21)
**Extends:** v1.0. Lessons become the long-tail search entry points — public
landing pages that answer the query and funnel to sign-up. The founding rule
holds absolutely: **the watchable lesson is the reward for signing up.**

---

## 1. Public lesson endpoint

`GET /api/courses/{slug}/lessons/{lslug}/public` — no auth. Safe fields only:
title, kind, duration, free_preview, module/course context, and `body_md`
**only when free_preview** (gated notes never go public). **No video fields,
ever** — the payload cannot leak an embed URL by construction. 404 for unknown
lessons and draft courses. (Characterization tests added in the same change.)

## 2. The anonymous lesson page

Replaces the generic sign-in wall (which had no content and empty metadata):

- Breadcrumb, lesson title, module + duration, "Free preview" badge.
- A **locked player panel** (aspect-video, 🔒): free → "Create a free account
  to watch this preview" → /signup; gated → "This lesson is for members" →
  /membership. Log In alongside.
- **Free lessons render their notes** (sanitized Markdown) — the indexable
  answer content. Gated lessons render the shell only.
- Prev/next lesson navigation (public course payload) — crawlable internal
  linking through the whole course.
- Closing CTA panel naming the course.
- JSON-LD: `LearningResource` (timeRequired, isPartOf Course,
  isAccessibleForFree: false — honest: watching requires an account) +
  `BreadcrumbList`.

Signed-in behavior is unchanged (player, progress, quizzes, member editor).

## 3. Index policy + metadata

- **Free-preview lessons: indexable.** Title "{Lesson} — {Course}", description
  derived from the first notes paragraph (markdown-stripped, ≤300 chars) with a
  context fallback, canonical, OG article.
- **Gated lessons: `noindex, follow`** — thin shells stay out of the index but
  pass link equity through.
- Sitemap gains every free-preview lesson (priority 0.6) — auto-updates as
  lessons are added or toggled free.

## 4. Consequence for authoring

Lesson notes on free previews are now public marketing copy AND the ranking
content. Writing real notes on every free preview is the highest-leverage SEO
action available — each one is a landing page.
