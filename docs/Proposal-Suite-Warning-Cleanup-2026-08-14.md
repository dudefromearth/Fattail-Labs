# Proposal: clear the 1,360 test warnings

**Date:** 2026-08-14  
**Baseline:** production `main` `89f2216` — 913 passed, 3 skipped, **1,360 warnings**  
**Parent:** [Round 1 audit](./Audit-Round-1-2026-08-14.md) items 11 and 12  
**Ask:** approve this plan. Do not implement until you say go.

The suite is green. The warnings do not fail a run today. They will, when the libraries drop the old APIs.

There are **three causes**. Almost all of the noise is the first one.

---

## Cause 1 — old cookie argument on the test client (~1,357 warnings)

**What it is.** Almost every test sends the session as `cookies=…` on `client.get` / `post` / `put` / `delete`. Starlette now says that argument is deprecated. It wants cookies set **on the client object**, then the request made without that argument.

**Whose code.** Ours — the test helper style — not a silent bug in the product.

**When it breaks.** The next Starlette that removes the argument. Collection or every authenticated test fails at once.

**Size.** Medium. About **73 test files** and **~1,070 call sites**. One shared helper, then a mechanical pass.

**How to fix.**

1. Add a small helper next to the existing test client (in `server/tests/conftest.py`), something like: set the session cookie on the client, run the request, then clear it so the next test does not inherit the previous member.
2. Replace `client.get(url, cookies=jar)` with that helper. Same for post / put / patch / delete.
3. Tests that switch members in one function (A then B) must clear between calls. Isolation tests depend on that.
4. Do **not** change product cookie behavior (`ft_session`, SameSite, domain). This is tests only.

**Done when.** `pytest tests -q` still 913 passed / 3 skipped, and the Starlette cookie warning count is **zero**.

**Risk.** Isolation tests (member A must not see member B) are the only place a sloppy helper can lie. Those files get a second look: journal, trade log, privacy, export.

---

## Cause 2 — retired clock in a retrospective test (2 warnings)

**What it is.** `server/tests/test_retrospectives.py` (around the “period was interrupted” test) calls `datetime.utcnow()`. Python has marked that dead. Production money code already uses timezone-aware UTC.

**Whose code.** Ours, test only, for this warning pair.

**When it breaks.** A future Python removes `utcnow`. That one test errors.

**Size.** Small. Two lines: `datetime.now(timezone.utc)` (or `datetime.now(datetime.UTC)`).

**Done when.** Those two warnings are gone. The test still means “a window in the past.”

**Nearby, not in today’s warning dump.** `server/access_control/types.py` still uses `datetime.utcnow` as a default clock for access decisions. That is product code, not the suite warning. Same clock change, still small. Call it out so we do not “finish warnings” and leave the live default on the dying API.

---

## Cause 3 — timeout on the test client (1 warning)

**What it is.** The live admin AI test (`test_ai_run_bravo_live_via_api`) passes `timeout=180` into the test client. Starlette says not to. That test is already skipped unless a live key is set, which is why you almost never see it — it fired once in the last full run.

**Whose code.** Ours, one test.

**When it breaks.** Same Starlette cleanup. Only that optional live test.

**Size.** Tiny. Drop the timeout argument. If a live call must not hang forever, wrap it in the test with a deadline outside the client (or skip on hang). Do not change the product AI timeout.

**Done when.** That httpx/Starlette warning is gone. Live skip still works without a key.

---

## Order of work

| Slice | What | Effort | Suite check |
|-------|------|--------|-------------|
| 1 | Clock: retrospective test (+ optional access-control default) | S | that test file + warning grep |
| 2 | Timeout: one admin AI test | S | that test file |
| 3 | Cookie helper + convert all `cookies=` sites | M | full `pytest tests -q`; cookie warning count = 0 |

Slices 1 and 2 can ship alone. Slice 3 is the one that removes the wall of noise.

**Out of scope.** MiniTwo. Product session cookies. Changing how members log in. Quarantining tests. The parking-lot branch.

**Not this proposal.** The quiet boot defaults and extra local database scripts from Round 1. Those are separate rulings.

---

## What I will not do until you say go

No file edits. No commit. No deploy.
