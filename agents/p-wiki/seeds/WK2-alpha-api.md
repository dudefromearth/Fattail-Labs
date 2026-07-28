# Seed WK2 — Alpha: Wiki HTTP API

**Project:** p-wiki · **Agent:** Alpha (+ Kilo) · **Prerequisite:** WK1

## Files in scope

- `server/wiki_routes.py` (new) + router registration in `main.py`
- `server/tests/test_wiki_api.py` (new)
- `Architecture/02-backend-design.md` (API surface rows)

## Out of scope

- Frontend · sync tick (WK3) · transcript search (parent W2)

## Endpoints (Interface Spec §§2–5; auth = member session unless noted)

| Route | Returns |
|---|---|
| `GET /api/wiki/index` | Browse payload: pinned/start-here set, kinds with counts, recent published (≤6) |
| `GET /api/wiki/pages/{slug}` | Page: frontmatter, body_md, backlinks[], sources[]; **draft → 404 for member, 200 for admin (WIK-D2)** |
| `GET /api/wiki/search?q=` | Ranked FULLTEXT results: slug, title, kind, snippet (title match > body match; recency tiebreak) |
| `GET /api/wiki/graph` | Published nodes + resolved wikilink edges (member) |
| `POST /api/admin/wiki/reindex` | Admin only; runs reindex; returns counts |

Rules: unauthenticated → 401; snippet generation server-side (~30 words, WI D-i5);
never 500 on unresolved links; no caching that leaks drafts.

## Completion (paste all outputs)

- [ ] `pytest server/tests/test_wiki_api.py -q` green
- [ ] Runbook §8.1 rows executable now: WI10 curl pair (404 member / 200 admin),
      search curl with ranked results, reindex counts
- [ ] 401 for anonymous on every member route (curl evidence)
- [ ] Backend-design doc updated same commit
