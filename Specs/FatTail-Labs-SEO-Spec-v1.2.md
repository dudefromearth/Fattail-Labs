# FatTail Labs — SEO Spec v1.2 (Layer 2b: category hub pages)

**Status:** Approved as built (2026-07-21)
**Extends:** v1.1. One prerendered keyword hub per category.

---

## 1. Model + API

- Migration 013: `categories.description_md` — the hub's intro copy, seeded for
  all nine categories in the doctrine voice (authoring follow-up: copy is
  editable only via seed/DB today; in-place editing is future scope).
- `GET /api/categories` (public, own router — the courses router's prefix
  would have swallowed it): slug, name, description_md, published-course count.

## 2. Hub pages (`/courses/category/{slug}`)

- SSG via generateStaticParams (non-empty categories), `dynamicParams` for
  later additions, hourly revalidation to track publishes.
- Render: breadcrumb, name, intro copy (sanitized Markdown), course count, the
  category's courses via the standard CatalogGrid (prerendered to full HTML),
  cross-links to every other non-empty hub.
- **Empty categories 404** — hubs must never be thin pages.
- Metadata: "{Name} Courses" title, copy-derived description, canonical, OG.
- JSON-LD: `ItemList` of the courses + `BreadcrumbList`.

## 3. Internal linking + discovery

- Catalog page gains a server-rendered "Browse by category" footer linking all
  non-empty hubs (crawlable entry — the interactive chips filter in place and
  are invisible to non-JS crawlers).
- Sitemap gains hub URLs (priority 0.7, weekly), non-empty only.
