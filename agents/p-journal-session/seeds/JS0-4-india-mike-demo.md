# Seed JS0-4 — India · Mike: Demo fixtures (D5)

**Project:** p-journal-session  
**Primary:** India · Mike  
**Reviewers:** Coach  
**Phase:** J0  
**Prerequisite:** none (D4 isolation context helpful)

## Goal

**D5:** `identities.is_demo` immutable at create; wholesale reset; never convert; excluded from aggregates/community; audited.

## Files in scope

- `Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md` (§3 D5, §13 full)  
- `Architecture/00-decision-log.md`  

## Out of scope

Implementation migration code (JS8-1); demo session content (JS8-2); Sierra marketing prose (JS0-6 co-reinforces exclusion).

## Invariants

- Single SoR for demo flag on `identities` · no per-session demo fork.  
- `is_demo` is not an auth bypass · Family B isolation still holds.  
- No waived gates.

## Completion criteria

- [x] D5 APPROVED | RETURNED  
- [x] Migration/placement named for JS8  

## Feeds

→ JS0-G · JS8-1 · JS8-2 · JS0-6 (marketing exclusion)

---

## Evidence (2026-07-29 — India · Mike JS0-4)

### Verdict: **APPROVED** (Coach reviews at JS0-0 / program GO; owners locked D5)

### D5: **LOCKED · APPROVED**

Normative Spec **§13**.

| Decision | Detail |
|----------|--------|
| Placement | `identities.is_demo TINYINT(1) NOT NULL DEFAULT 0` |
| Not on | sessions/messages/attachments (inherit from identity) |
| Migration | **JS8-1** — next free `0NN_identities_is_demo.sql` (or earlier if tests need column; same DDL) |
| Create | Ops/CLI explicit demo flag only; SSO/signup/webhooks → `0` |
| Immutable | No API/webhook/admin flip `0↔1` after create |
| Never convert | Flag never clears; demo may hold plans for testing but stays demo |
| Lifecycle | Wholesale purge + reseed preferred; admin reopen of closed dates **demo only** (§10) |
| Exclusions | Leaderboard, journey peer visibility, live aggregates, marketing proof |
| Audit | Still audited; demo label on subject |
| Security | Not an auth bypass; isolation intact; client cannot self-assert |

### India (domain)

- Single column avoids dual taxonomy on journal tables.  
- J1–J7 need almost no demo branching (reopen gate + aggregate filters + J8 seeds).  
- Aligns with existing `seed_practice_demo_pack.py` extension path (JS8-2).  
- Import: reject applying `is_demo: true` onto a non-demo identity.

### Mike (security)

- Create path only; immutability server-enforced.  
- No privilege escalation via `is_demo`.  
- Cross-demo isolation same as real members.  
- Export may *emit* flag for honesty; import must not elevate/relabel.

### Migration/placement named for JS8

| Seed | Work |
|------|------|
| **JS8-1** | Migration `0NN_identities_is_demo.sql`; create_user/demo provisioner; reject flip; leaderboard/aggregate hard exclude; audit label |
| **JS8-2** | Extend `seed_practice_demo_pack.py` with `journal_session` entries for demo identity |

**As-built:** no `is_demo` column today (`migrations/` through 048) — greenfield column on JS8-1.

### Spec edits this seed

1. D5 → LOCKED  
2. §13 expanded (placement, immutability, lifecycle, exclusions, audit, security, India notes)  
3. Header + §19: D1–D7 locked; build still needs JS0-G + Coach GO  

### Required follow-ons (not RETURN)

| Item | Owner seed |
|------|------------|
| Implement column + gates | JS8-1 |
| Session demo pack content | JS8-2 |
| Marketing exclusion statement | JS0-6 Sierra |
| Coach formal GO | JS0-0 after JS0-G |

### Coach reviewer note

D5 is **owner-locked** for Spec integrity. Program **build authority** remains **JS0-G PASS + Coach GO** (JS0-0). Coach may still RETURN D5 at GO if product intent differs; no silent waive.
