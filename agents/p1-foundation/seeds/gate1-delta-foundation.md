# Seed Gate 1 — Delta: Foundation Gate

**Project:** p1-foundation · **Agent:** Delta
**Depends on:** F1–F4 reported PASS
**Repo:** `/Users/ernie/Fattail-Labs` · **Read first:** `agents/bench/delta.md`,
the four seed files (criteria you are re-verifying), F1–F4 reports

## Objective

Independently verify the foundation end-to-end. You re-run checks yourself; prior agent
reports are claims, not evidence.

## Checks (each executed live, output captured)

**Spine**
- [ ] Fresh-database migration: drop + recreate `labs` dev DB, run `migrate.py` — clean;
      run again — nothing pending
- [ ] Seed script twice — idempotent (row-count evidence)
- [ ] `/api/health` ok; `/api/auth/me` unauthed → 401

**Public API**
- [ ] Catalog endpoint: shapes match F3 report; filters + sort behave
- [ ] Draft course invisible (list + 404 on detail)
- [ ] No gated fields (video_id, body_md) in any public payload

**Public pages**
- [ ] `npm run build` clean; static page per published course, none for draft
- [ ] Raw-HTML curl of catalog + one course page: full content present without JS
- [ ] Course JSON-LD parses and contains name/description/url/image/provider/instructor
- [ ] Titles unique per page; canonical + OG present
- [ ] Browser walk: catalog filters/search work; course tabs render; lock icons on
      gated lessons; console clean on every page

**Regression / hygiene**
- [ ] `git status` clean of secrets (`.env` untracked); no MSC imports anywhere
      (`grep -ri marketswarm server/ web/` — expect only docs/comments if anything)
- [ ] Repo layout still conforms (Specs/Architecture/infra/agents intact)

## Report

File `gate-reports/gate-1.md`: verdict **PASS / FAIL / BLOCKED**, per-check evidence,
enumerated defects on FAIL (owner + severity), and your recommendation to Coach
(advance to P1c member path, or re-seed).
