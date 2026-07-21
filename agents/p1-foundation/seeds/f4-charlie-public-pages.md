# Seed F4 — Charlie: Catalog + Course Detail Pages (SSG + JSON-LD)

**Project:** p1-foundation · **Agent:** Charlie · **Gate:** feeds Gate 1
**Depends on:** F2 PASS + F3 PASS (use response shapes from Alpha's F3 report)
**Repo:** `/Users/ernie/Fattail-Labs` · **Read first:** `agents/bench/charlie.md`,
spec §5.1–5.2 (page anatomy), §5.6 (SEO/AEO requirements — every item is a requirement,
not a suggestion)

## Objective

Build the two public pages that ARE the product's front door: `/courses` (entry point)
and `/courses/[slug]`, statically generated from the API at build time, with the full
SEO/AEO layer.

## Task sequence

1. `/courses` — SSG (`generateStaticParams`/fetch at build): course card grid per spec
   §5.1 — category tags, title, description (clamped w/ expand), instructor, level
   badge, enrolled count, NEW badge (<30 days). Category/level filter chips + search
   (client-side over the static payload is fine for P1). Unique title:
   "Courses & Tutorials — FatTail Labs".
2. `/courses/[slug]` — SSG per published course, per spec §5.2: breadcrumb, hero
   (image + title + metadata strip: level/rating-or-dash/modules·lessons/categories),
   tabs About | Modules (accordion with lesson rows, type icons, lock icons on
   non-free-preview) | Resources — Discussion/Students tabs render as disabled stubs.
   Right rail: static "Join to Enroll" card (auth comes later).
3. SEO layer (§5.6) on every course page: unique `<title>` ("{Course} — FatTail Labs"),
   meta description from course copy, canonical, OG set, `BreadcrumbList` JSON-LD, and
   **Course JSON-LD** (name, description, url, image, provider Organization, instructor
   Person, hasCourseInstance courseMode Online). Omit aggregateRating while null.
4. Plain-HTML proof: fetch each page with curl (no JS) and confirm full content + valid
   JSON-LD in the raw HTML.
5. Verify in browser against built output; mobile + desktop; console clean.

## Out of scope

Auth/enroll actions · player content · reviews UI · design polish beyond clean
defaults (Echo's pass comes later — structure and hierarchy should still be sane).

## Completion criteria (all with captured output)

- [ ] Build generates a static page per published course (build summary shown)
- [ ] curl of one course page: full content in raw HTML; JSON-LD parses (show it)
- [ ] Unique titles verified across pages; draft course generates NO page
- [ ] Browser screenshots: catalog + flagship detail, mobile + desktop
- [ ] Console clean

## Report

PASS / FAIL / BLOCKED + evidence.
