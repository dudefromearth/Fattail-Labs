# FatTail Labs — Test Suite Spec v1.0

**Status:** Approved as built (2026-07-21)
**Context:** Sixteen feature commits were verified by hand (curl matrices in
the decision log) with zero automated coverage. This suite codifies that
verified behavior as characterization tests — the safety net for refactors and
the launch.

---

## 1. Shape

- `server/tests/` — pytest + FastAPI TestClient (in-process; no running server).
- Runs against the **dev database**: seeded standing content (published courses,
  the four standing recurrences, plans) is a read-only fixture; anything a test
  creates is `zztest-*`-named and deleted by its fixture, pass or fail.
- Sessions are minted directly (`auth.issue_session`) per role; member tests
  that hit FK constraints use a real probe identity (created + fully cleaned by
  the `probe_identity` fixture).

## 2. Coverage

| File | Guards |
|---|---|
| test_auth_roles | health, /me gating, cumulative role ladder, bad-JWT = anonymous |
| test_catalog | published-only listing, card payload shape (dropped columns stay dropped), draft 404 public / 200 admin, admin-API gating |
| test_lesson_gating | anon 401 even for free; observer free-only; alumni+ gated; nocookie embed URLs |
| test_live_sessions | standing-schedule materialization vs an independent calendar oracle; category gating matrix (anon/activator/navigator); public in-window join exposure; scope one/future/all edits + cancel; occurrence validation 404/422; until_days/until_date bounds + conflicts; RRULE ICS |
| test_resources | session-gated listing; free vs members download matrix; description/emoji round trip + NULL normalization; emoji length cap |
| test_media | upload → list → referenced-delete 409 (names referrer) → dereferenced-delete 200; admin-only; traversal + bad-type rejection |
| test_member_progress | enroll round trip; 60s delta clamp; 90% auto-complete; anon 401 |
| test_alumni | 5-day tenure → nothing; 35-day → alumni year (period end ≈ +1y); active plan beats alumni; expired membership stops granting |
| test_quizzes | public payload never leaks correct/explanation; answer-key submission scores 100% |
| test_ai_models | Grok primary / Claude secondary interface; prefer/auto; fake providers |
| test_agent_tasks | every studio agent × task via charters + fake Grok; pipeline order |
| test_ai_admin_api | admin AI gateway auth, status, fixtures; live run skip without `XAI_API_KEY` |

**Browser (separate, web package):** `web/e2e/agent-workbench.spec.ts` (Playwright).
Requires running web+API; live agent assertions require `XAI_API_KEY` on the API.

## 3. Rules

- `cd server && .venv/bin/python -m pytest tests -q` — must pass before every
  commit that touches `server/`.
- New features add their characterization tests in the same change
  (documentation-parity rule extended to behavior).
- Deps pinned in requirements.txt (pytest, httpx).
