# WU-R0-3 Sierra — Wiki Spec v0.2.1 (public wiki SEO/AEO)

**Agent:** Sierra  
**Spec:** `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` III.2, I.3, I.4  
**Parents:** SEO Spec v1.3 · Course hosting public-catalog patterns  
**Date:** 2026-08-23  
**Spec not modified.**  
**Verdict:** **NO BLOCK** on the spec or on GO SPEC. **This review must sit
in-tree before any WU-2 stamp request** (plan R0-3). WU-2 timing is blank
this packet — notes only.

---

## First Sierra gate for this program

Published wiki pages become a **public acquisition surface** (DL-551). They
must obey the same copy and schema discipline as the course catalog: process
outcomes, no profit claims, extractable answers, unique titles.

**ADVISORY (WU-2 implementation law, not a spec rewrite):**

| Artifact | Shape (follow course catalog; do not invent a third SEO stack) |
|----------|--------|
| Unique `<title>` | `{page title} — FatTail Labs` via existing template in `web/app/layout.tsx` |
| Meta description | First ~40–60 words of the page as a **direct answer**, not a teaser. Process language only. |
| Canonical | `metadataBase` already fail-loud from `NEXT_PUBLIC_SITE_URL` |
| JSON-LD | One type Sierra will name at WU-2 seed (likely `Article` or `TechArticle` + `BreadcrumbList`). **Not** `Course`. Schema must not promise media the page does not serve. |
| Sitemap | Published slugs only. **Drafts never.** Unpublish (published → draft) **drops the URL** (Coach-adopted WU-2-G row). |
| FAQ / AEO | Only if the page actually contains Q&A; `FAQPage` JSON-LD from the **same array** as visible FAQ (SEO v1.3). Do not fabricate FAQs for AEO. |
| `llms.txt` | Optional later: add wiki Start-here URLs. Not WU-2 blocking. |

**BLOCKING if implemented (WU-2):** profit-claim meta/JSON-LD; sitemap of
drafts; schema `Course`/`Offer` on a wiki page (that is catalog law, not
wiki); indexing `/app/wiki` search-result URLs with query strings.

**ADVISORY:** Public wiki is the compiled map, not a sales page. Lead
answers describe **what the page is in the map**, not “you will make money.”
Hotel still owns claims in the body; Sierra owns titles/meta/schema.

**ADVISORY:** Do not prerender member-only chrome (agent launcher, admin
edit, “In your practice”) into public HTML. Echo/Mike share this.

## Bench delta

Public wiki SEO reuses course catalog machinery. Unpublish must evict
sitemap entries — record for WU-2-G.
