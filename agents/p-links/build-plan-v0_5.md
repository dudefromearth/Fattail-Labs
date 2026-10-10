# Links — Phase 1 build plan v0.5 — W2 may touch the redirect route

**Plan:** v0.5
**Supersedes:** `agents/p-links/build-plan-v0_4.md` (left on disk). Every v0.4 term still stands except the W2 allowlist line below.
**Law:** `Specs/LK-1.1.md`. Do not edit LK-1, LK-1.1, or the stamp.
**Machine:** StudioTwo.

## What changed v0.4 → v0.5

| Area | v0.4 | v0.5 |
|---|---|---|
| W2 allowlist | worker and `publicRedirect.ts` only | also `web/app/q/[slug]/route.ts`, so the route can pass the peer address |

The Next route is the only place that can see the visitor's address. W2 may change that file only to pass the peer address into `publicRedirect`. It still must not read or forward a cookie, and it still must not call port 4000 or `/api`.

### W2 Alpha allowlist

- `server/links/qr.py`
- `server/links/geo.py`
- `server/links/fixtures/geolite2-test.mmdb`
- `server/requirements.txt`
- `server/tests/test_links_w2.py`
- `server/links/public_worker.py`
- `web/lib/links/publicRedirect.ts`
- `web/app/q/[slug]/route.ts`

W1 is GO (`agents/p-links/gate-reports/W1-G.md`). Do not reopen it. Restart the worker on `127.0.0.1:4017` after the worker file changes. Do not restart ports 3000 or 4000.
