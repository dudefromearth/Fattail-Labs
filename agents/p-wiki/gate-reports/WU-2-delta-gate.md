# WU-2-G Delta Gate — public wiki read (2026-08-23)

**Gate:** plan v1.0 WU-2-G + unpublish-transition  
**Spec:** v0.2.1 III.2 · **DL-551** · **DL-558** · **GO WU-2**  
**Verdict: PASS**

Delta did not modify the work under review.

Sierra review in-tree: `reviews/WU-2-0-sierra.md`  
Mike review in-tree: `reviews/WU-2-1-mike.md`

## Allowlist

| Path | Role |
|------|------|
| `server/routes/wiki.py` | public published reads; `GET /api/wiki/sitemap`; `lead` |
| `server/tests/test_wiki_api.py` | anon published 200 / draft 404 |
| `server/tests/test_wiki_wu2.py` | Kilo + unpublish-transition |
| `web/app/app/wiki/page.tsx` | no sign-in wall |
| `web/app/app/wiki/[slug]/page.tsx` | public article; no practice rail |
| `web/app/app/wiki/[slug]/layout.tsx` | metadata + JSON-LD |
| `web/app/app/wiki/search/page.tsx` | public search |
| `web/app/app/wiki/graph/page.tsx` | public graph |
| `web/app/app/wiki/layout.tsx` | entry metadata |
| `web/lib/wiki/articleJsonLd.ts` | Article + BreadcrumbList |
| `web/app/sitemap.ts` | published wiki URLs |
| `agents/p-wiki/reviews/WU-2-*.md` | Sierra + Mike |
| `Architecture/00-decision-log.md` | **DL-558** |
| `Architecture/11-wiki-design.md` | WU-2 paragraph |

**Not touched:** AppChrome · `web/app/layout.tsx` · HelpLauncher · registration ·
Factory/charter · wiki-agent session API.

## Evidence

### Wiki suite

```
62 passed in 3.63s
```

(`test_wiki_*` + agent + WU-1 + WU-2)

### House box

```
7 failed, 1150 passed, 4 skipped in 419.71s
```

Failures: Curate `Phase 'development' is full` only (7). OPF session test
passed this run. SSR not in the fail list. Within tolerated 8 (OPF + curate).
No new wiki-packet failures.

### Gate table

| Criterion | Result |
|-----------|--------|
| Unauthenticated published → 200 | **PASS** `test_anon_published_200_draft_404` / `test_anonymous_published_ok_draft_404` |
| Draft → 404 anon and member; admin 200 | **PASS** same |
| Unpublish-transition | **PASS** `test_unpublish_drops_public_and_sitemap` |
| “In your practice” not a public rail title | **PASS** `title: "In your practice"` absent from article page |
| Sign-in walls gone | **PASS** no `Sign in to` under `web/app/app/wiki/` |
| Sierra JSON-LD | **PASS** `Article` + `BreadcrumbList`; not Course/Offer |
| Sitemap published only | **PASS** API + Next consumes `/api/wiki/sitemap` |
| Lead/extractable answer | **PASS** `lead` on page JSON |
| Freeze | **PASS** `git diff --stat` AppChrome / root layout / HelpLauncher empty |

### git diff --stat vs freeze

```
web/components/AppChrome.tsx        (empty)
web/app/layout.tsx                  (empty)
web/components/HelpLauncher.tsx     (empty)
```

## Isolation

No registration. No Factory. Session API still admin-only. Guidelines
untouched.

## Stop line

**STOP after WU-2-G.** WU-3 remains unstamped (Help Package spec unnamed).
