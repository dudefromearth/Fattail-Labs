# AC0-5 — Sierra SEO / AEO Review

**Project:** p-access-control  
**Agent:** Sierra  
**Date:** 2026-08-02  
**Spec:** v0.4 §§6.1–6.2, 12  
**Also:** SEO Spec v1.0–v1.3; as-built `web/app/sitemap.ts`  
**Seed:** `seeds/AC0-5-sierra-seo.md`

---

## Verdict: **APPROVED**

---

## Checklist

| # | Topic | Finding |
|---|--------|---------|
| 1 | Sitemap = anonymous HTTP 200 | **APPROVED.** Compatible with current generator (static public routes + free_preview lessons). AC6 must replace free_preview-only filter with **anonymous decision → status 200** helper so hide/redirect/time-closed policies stay out of sitemap without manual lists. |
| 2 | hard lock 200 indexable | **APPROVED for AEO with care.** 200 lock card may remain indexable if public shell + honest non-media page (matches SEO lesson landing discipline: no VideoObject promising gated media). Do not put full lesson body in lock response. |
| 3 | hide → 404 omit | **APPROVED.** Operational: policy write → revalidate_for_targets + sitemap regeneration path. Characterization: hide course not listed. |
| 4 | JSON-LD × free_preview × policies | **APPROVED with dual-write note.** During dual-write, free_preview and policy must not diverge on public sample lessons. JSON-LD on course pages stays public marketing shell; lesson schema must not promise media when access deny. Prefer generate JSON-LD from public shell only. |
| 5 | Spec edits required? | **None blocking.** §6.2 one-liner is implementable. Optional as-built: document sitemap helper next to SEO Spec when AC6 lands. |

---

## Crawl-trust notes

- Prefer stable 200 lock over oscillating 404 for temporary campaigns (use time windows + soft/hard rather than hide for short promos).  
- hide is for true removal from catalog surface.  
- robots.txt member routes already disallowed — unchanged.  
- Skeleton SSG must not inject fake “open” content for crawlers; anonymous decision drives public HTML.

---

## Sign-off

**Sierra: APPROVED** for BUILD AUTHORITY; AC6 implements sitemap 200-rule.
