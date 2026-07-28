# WK0 — India audit: wiki scaffold vs spec (2026-07-27)

**Auditor:** India seat (Claude session) · **Scope:** uncommitted wiki scaffold + migration 034

## Verdict: KEEP with fixes. Scaffold is spec-faithful; backend absent by design.

## Findings

| # | Severity | File | Finding | Disposition |
|---|---|---|---|---|
| 1 | — | `migrations/034_wiki_replaces_vexy_app.sql` | Correct per Interface §1.1 + D-i4; applied on dev (verified via `/api/apps`) | KEEP as-is |
| 2 | — | `web/app/app/wiki/page.tsx` | Zones correct (§2); search-first; honest empty Start-here; auth gate ok; copy clean | KEEP — bind zones to `/api/wiki/index` (WK4) |
| 3 | P1 | `web/app/app/wiki/search/page.tsx:67-81` | Hardcoded "Index not built yet" card | REPLACE with API-driven results (WK4) |
| 4 | P1 | `web/app/app/wiki/graph/page.tsx:59-61` | Placeholder graph box | BIND to `/api/wiki/graph`; keep list fallback structure (WK4) |
| 5 | P1 | (missing) | No article route `[slug]/page.tsx` — core reading surface absent | NEW in WK4 |
| 6 | P2 | all three pages | Per-page `fetch(/api/auth/me)` duplication | ACCEPT for W1; note for Framework convergence |
| 7 | P2 | `page.tsx:159` | Footer cites spec names in member-visible UI | REMOVE in WK4 (internal reference leaking to members) |
| 8 | — | copy audit | No profit framing, no member data, sentence case ok | PASS |

## Boundary rulings

- No parallel store implied anywhere in scaffold — PASS (WIK-D1 holds).
- `⌘K` hint rendered but no switcher — WK4 must implement or remove the hint (must not ship a dead affordance).

## Commit plan (wiki work only — Grok's unrelated uncommitted work stays untouched)

Repo currently carries non-wiki uncommitted changes (`web/app/hub/`,
`web/components/launch/`, `web/lib/launch.ts`, modified AppChrome/globals/lesson
files, decision-log edit). **None of these are staged by p-wiki commits.**

| Commit | Contents |
|---|---|
| C1 `spec: member wiki + interface v0.1 (+ runbooks)` | `Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md`, `Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md` |
| C2 `plan(p-wiki): charter, implementation plan, seeds` | `agents/p-wiki/**` |
| C3 `feat(wiki): card + member surfaces scaffold` | `migrations/034_*.sql`, `web/app/app/wiki/**` (as repaired by WK4) |
| C4 `feat(wiki): W1 backend spine` | `migrations/035_*.sql`, `server/wiki_store.py`, `server/wiki_routes.py`, `server/config.py`, tests, `main.py` hunk only |
| C5 `docs(wiki): architecture, deploy, admin guide, decision log` | WK3 + WK7 doc outputs (decision-log hunk coordinated — file already has unrelated local edits; stage hunk, not file) |

Order: C1 → C2 → C4 → C3 → C5 (specs before code; backend before wired frontend so
main never carries a frontend calling absent endpoints).

Caveat: `main.py` and `Architecture/00-decision-log.md` carry unrelated edits —
stage by hunk (`git add -p`) for C4/C5.
