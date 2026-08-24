# WU-2-0 Sierra — public wiki SEO/AEO (implementation)

**Agent:** Sierra  
**Spec:** Wiki Spec v0.2.1 III.2 · SEO Spec v1.3  
**Date:** 2026-08-23  
**Verdict:** **GO** for WU-2 stamp. Reuse the course catalog stack. Do not invent a third SEO system.

## Law for this packet

| Artifact | Shape |
|----------|--------|
| Title | `{page.title}` via root template ` — FatTail Labs` |
| Meta description | First 40–60 words of the page as a **direct answer** (plain text). Process language. No profit claims. |
| Canonical | `siteUrl("/app/wiki/{slug}")` / `siteUrl("/app/wiki")` for entry |
| JSON-LD | `Article` + `BreadcrumbList` on article pages. **Not** `Course` / `Offer`. No media schema unless the page serves media (it does not). |
| FAQPage | **Do not fabricate.** Only if a page already has visible Q&A (none required in WU-2). |
| Sitemap | `GET /api/wiki/sitemap` → published slugs only. Next `web/app/sitemap.ts` consumes it. Drafts never. Unpublish drops the URL. |
| Entry `/app/wiki` | Collection-style title “Wiki”; description is the compiled-map one-liner (process, not sales). |

**BLOCKING if implemented:** profit-claim meta/JSON-LD; sitemap of drafts; `Course`/`Offer` on a wiki page; indexing `?q=` search URLs.

This review is the in-tree Sierra gate the plan required before WU-2 stamp.
