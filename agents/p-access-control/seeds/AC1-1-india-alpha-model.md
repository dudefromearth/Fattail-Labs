# Seed AC1-1 — India + Alpha: Target model constants

**Project:** p-access-control  
**Agents:** India (design sign-off) · Alpha (code)  
**Depends on:** W0-G PASS + Coach **BUILD AUTHORITY** on Spec v0.4  
**Spec:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md` §§4–6  
**Plan:** `docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md` §6 AC1  

---

## Intent

Lock target-key grammar and type-default table as **code constants** (no silent config). No DDL yet.

---

## Read first

1. Spec §§4.2, 4.3, 6.3  
2. Identity Access Spec (role ladder, plan slugs)  
3. Enrollment Access Spec (lesson defaults / free_preview)  
4. As-built: `server/` auth membership helpers  

---

## Files in scope

- `server/access_control/` package scaffold (`__init__.py`, `constants.py`, `keys.py` or equivalent)  
- Optional: brief note in `Architecture/00-decision-log.md` if India requires  

## Out of scope

Migrations; evaluate implementation; HTTP routes; UI.

---

## Deliverable

1. Target key parse/validate helpers (`surface:`, `app:`, `course:`, `module:`, `lesson:`, `resource:`, `campaign:`)  
2. Type-defaults table as constants matching Spec §6.3 (today’s as-built until policy exists)  
3. Plan slug buckets: OBSERVER / ACTIVATOR / NAVIGATOR / COACHING (alumni **not** in commercial expand)  
4. India written **APPROVED** on constant surface  

---

## Invariants

- Expand-at-eval only (no frozen expanded lists stored)  
- Alumni non-commercial  
- Config-driven fail-loud; no silent defaults for missing env if any env used  
- No MSC imports  

---

## Completion

- [ ] Package imports cleanly under `server/`  
- [ ] India APPROVED on keys + defaults + plan buckets  
- [ ] Unit-testable pure functions (no DB)  

## Feeds

→ AC1-2 (schema) · AC1-3 (engine)
