# C1a-1 — Alpha schema + API (Community shell)

**Agent:** Alpha  
**Date:** 2026-08-06  
**Depends on:** C0-G PASS  
**Verdict:** **PASS**

## Scope delivered

| Item | Evidence |
|------|----------|
| Migration `090_community_app.sql` | Applied: `community_channels`, `community_bot_shares`, apps seed |
| Seed channels | general, practice, strategy-lab, toughness — no journey/wiki |
| Apps hub | slug `community` → `/app/community`, status live |
| Domain | `server/community_domain.py` |
| Routes | `server/routes/community_app.py` registered in `main.py` |
| Web shell | `web/app/app/community/page.tsx` + `CommunityApp.tsx` |
| Hub card | `web/app/app/page.tsx` TOP_LEVEL_ORDER + FALLBACK |
| Tests | `tests/test_community_app_c1a.py` — **7 passed** |

## API (session required)

- `GET /api/me/community/board`
- `GET /api/me/community/channels`
- `GET /api/me/community/channels/{slug}`
- `GET /api/me/community/apps/{app_key}/channel`
- `GET /api/me/community/shelves/fattail`
- `GET /api/me/community/shelves/shares`
- `GET /api/me/community/discord/status` (C1a stub; linked=false)
- `GET /api/me/community/channels/{slug}/messages` (empty until C1c)

## Out of scope (correct)

Discord Gateway, WP link ingest, message mirror, publish/apply — C1b–C1d.

## Pytest evidence

```text
cd server && .venv/bin/python -m pytest tests/test_community_app_c1a.py -q
.......  7 passed
```

## Unlocks

Charlie polish if needed · **C1a-G** Delta with page load smoke · then C1b.
