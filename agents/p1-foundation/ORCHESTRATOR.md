# P1 Foundation — Orchestrator Playbook

**Charter:** [`CHARTER.md`](./CHARTER.md) — purpose, pillars, success criteria (retroactive;
P1 is closed / load-bearing). Prefer the charter and `Architecture/` over this board for
*what P1 is*; this file is a **historical** execution playbook (Gate 1 era) and may lag
current product surface.

**Your role:** Coach / orchestrator only. You do not run migrations, SQL, or builds.
You open agent sessions and load seeds; agents report **PASS / FAIL / BLOCKED**.

**Repo of record:** `/Users/ernie/Fattail-Labs` only.
**Spec:** `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` (P1 scope: §14 phase table)
**Governance:** `agents/bench/doctrine.md` · gates per `agents/bench/delta.md`

---

## How you work at each junction

1. Read **Current junction** below (or the latest agent report).
2. Open a **new session** in Fattail-Labs (or continue a loaded agent).
3. Load the seed: "Load and execute `agents/p1-foundation/seeds/<file>.md`".
4. Agent finishes with PASS/FAIL/BLOCKED and what you do next.
5. You decide: **advance · re-seed · stop** for a human product decision.

---

## Board (status)

| Step | Status | Who | Seed |
|------|--------|-----|------|
| F0 Repo scaffold (server spine, migrations, bench) | **DONE** (commit 9cd8d1d) | — | — |
| F1 Dev database + live spine verification | **PASS** (2026-07-21) | Foxtrot | `seeds/f1-foxtrot-dev-db.md` |
| F2 Next.js app scaffold (`web/`) | **PASS** (2026-07-21) | Charlie | `seeds/f2-charlie-web-scaffold.md` |
| F3 Public read API + seed data | **PASS** (2026-07-21) | Alpha | `seeds/f3-alpha-public-read-api.md` |
| F4 Catalog + course detail pages (SSG + JSON-LD) | **PASS** (2026-07-21, 2 defects fixed in-flight) | Charlie | `seeds/f4-charlie-public-pages.md` |
| Gate 1 — Foundation | **PASS** (`gate-reports/gate-1.md`) | Delta | `seeds/gate1-delta-foundation.md` |
| Coach: approve P1b→P1c transition | **NEXT — your approval** | You | — |

---

## Current junction → what you do

### NOW: P1c in progress — identity & access core SHIPPED (native + pluggable providers); next: enroll/progress/member playback. WP-side SSO endpoint remains the external dependency for live WordPress login.

Read `gate-reports/gate-1.md`. On your approval, Juliet seeds the member-path packets
(SSO callback, enroll, progress, player). External dependency to schedule first:
the SSO endpoint on fattail.ai WordPress (Mike coordinates).

Uncommitted work from F1–F4 + Gate 1 is on the working tree — commit when satisfied.

---

## Out of scope for P1 Foundation (do not let agents drift into these)

SSO callback flow (next project: needs WP-side endpoint), member routes/enrollment,
admin builder, video CDN integration, WooCommerce webhooks, deployment to
DudeTwo/MiniTwo. Lesson player page ships as a stub route only.
