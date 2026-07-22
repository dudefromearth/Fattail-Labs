# FatTail Labs — SEO Spec v1.0 (Layer 1: technical foundation)

**Status:** Approved as built (2026-07-21)
**Context:** The Lab's SEO position rests on content that already exists —
statically prerendered, full-HTML public pages readable by search and AI
crawlers alike. This spec is the technical plumbing layer; the strategy layers
follow (§4).

---

## 1. Canonical host

`https://labs.fattail.ai` is the single canonical origin. Every variant 301s to
it at the MiniThree nginx vhost (recorded in infra/deploy.md — wired launch
day, before the domain is announced). All generated URLs (sitemap, robots,
canonicals, OG) derive from `NEXT_PUBLIC_SITE_URL`, which is **fail-loud**:
missing env breaks the build, never the crawl.

## 2. Crawl surface (as built)

- **`/sitemap.xml`** (`app/sitemap.ts`): `/courses` (priority 1, daily),
  `/membership` (0.9), `/live` (0.7, daily — the schedule changes),
  every published course (0.8, lastmod = published_at). Driven by the same API
  the pages render from — publish/delete update it automatically (hourly
  revalidate + publish-time revalidation).
- **`/robots.txt`** (`app/robots.ts`): allow `/`; disallow `/me`, `/dashboard`,
  `/admin/`, `/api/`, `/login`; sitemap pointer. AI crawlers are deliberately
  NOT blocked — full-HTML prerendering exists so they can read the site.
- **`noindex`** page metadata on `/me` and `/dashboard` (belt to robots'
  suspenders — robots stops crawling, noindex stops indexing of anything that
  slips through); admin routes already carried it.
- **`metadataBase`** on the root layout: relative OG images (course banners)
  and canonicals resolve to absolute canonical-host URLs. Root layout also
  sets `og:siteName`/`og:type` defaults.

## 3. Already in place (pre-this-spec, recorded for completeness)

SSG/full-HTML public pages; Course + BreadcrumbList JSON-LD; aggregateRating
at ≥3 reviews; unique titles + template; per-course canonical + OG incl.
banner image; drafts 404; youtube-nocookie embeds.

## 4. Roadmap (specs to come, in order)

1. **Free-lesson landing pages** — public page shells for lessons (video stays
   gated; title/notes/CTA public) = the long-tail traffic layer.
2. **Category hub pages** — /courses/category/{slug}, prerendered, with copy.
3. **Structured-data expansion** — VideoObject (trailers/free lessons), Event
   (public live shows), offers on Course, Person/Organization entity graph,
   FAQPage on membership.
4. **AEO polish** — FAQ content blocks, llms.txt, consistent entity naming.

Anti-goals: no bolted-on blog, no keyword-stuffed copy, nothing that bypasses
the enrollment funnel.
