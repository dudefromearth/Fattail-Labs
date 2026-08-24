# WU-2-1 Mike — public wiki exposure (implementation)

**Agent:** Mike  
**Spec:** Wiki Spec v0.2.1 I.3 · III.2 · DL-551  
**Date:** 2026-08-23  
**Verdict:** **GO** for WU-2 stamp.

## Checklist (prove at WU-2-G)

| # | Mechanic |
|---|----------|
| 1 | Unauthenticated GET of `status=published` → **200** |
| 2 | Unauthenticated GET of `status=draft` → **404** (not 401 — do not confirm unpublished slugs via auth) |
| 3 | Non-admin member GET of draft → **404** (unchanged) |
| 4 | Admin GET of draft → **200** |
| 5 | “In your practice” **absent** on unauthenticated HTML (no empty heading) |
| 6 | No `identity_id`, journal, trade-log, capital in public wiki JSON |
| 7 | Session / ledger / agent APIs stay admin-gated |
| 8 | Unpublish: published → draft → public **404** and **dropped from sitemap** |
| 9 | No “Sign in to read/search the wiki” on published surfaces |

**BLOCKING if implemented:** public drafts; public session open; Family B on a public page; 401 on published content.

Compile-inbox and reindex remain admin/agent. Do not open those.

This review is the in-tree Mike gate the plan required before WU-2 stamp.
