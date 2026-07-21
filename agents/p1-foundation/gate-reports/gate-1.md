# Gate 1 — Foundation · Report

**Date:** 2026-07-21 · **Agent:** Delta · **Verdict: PASS**
**Caveat:** this gate was executed by the same session that implemented F1–F4 (Coach
directed single-session execution). Checks were re-run fresh, but independence was
procedural, not organizational.

## Evidence summary

**Spine**
- Fresh DB cycle: `DROP DATABASE labs` → recreate → `migrate.py` applied 001 → second
  run "No pending migrations." ✅
- Seed twice: "3 courses, 10 lessons" both runs (idempotent) ✅
- API restarted (PID verified via lsof), `/api/health` → `{"status":"ok","env":"dev"}`
  (DB round-trip), `/api/auth/me` unauthed → 401 ✅

**Public API**
- List: exactly the 2 published courses; category filter (`0-dte` → butterfly only) and
  sorts verified during F3 ✅
- Draft `advanced-convexity-lab`: absent from list, 404 on detail ✅
- Gated-field leak: `body_md`/`external_url` absent; `video_id` appears only as
  `trailer_video_id` ✅

**Public pages**
- Build: SSG page per published course, none for draft ✅
- Raw HTML (no JS): full course content incl. gated lesson titles; JSON-LD `Course` +
  `BreadcrumbList` parse; canonical + OG present; unique titles per page ✅
- Browser walk: catalog chips/search functional, tabs render, free-preview/lock states
  shown; console clean, desktop + mobile ✅

**Hygiene**
- `.env` / `web/.env.local` git-ignored, not staged ✅
- No MSC imports (single grep hit = explanatory docstring in `server/auth.py`) ✅
- Repo layout intact ✅

## Defects found & fixed during execution (recorded for the pattern log)

1. **Stale process served old build** (F4): `pkill` pattern missed the running Next
   server; new server died EADDRINUSE; verification initially ran against the old build.
   Fixed by killing by PID from `lsof`. This is exactly the deploy-doctrine failure mode
   — restarts must be verified by PID, and `infra/deploy.md` already mandates this.
2. **Mobile horizontal overflow** (F4): layout grid without an explicit mobile template
   let the implicit column exceed the viewport. Fixed with
   `grid-cols-1` / `minmax(0,1fr)` + scrollable tab bar. Echo should adopt "no page-level
   horizontal scroll at 375px" as a standing review check.

## Recommendation

Advance to P1c (member path: SSO callback + enroll + progress + player). WP-side SSO
endpoint on fattail.ai is the external dependency to schedule first.
