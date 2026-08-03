# Seed AC1-4 — Kilo: engine unit tests

**Project:** p-access-control  
**Agent:** Kilo  
**Depends on:** AC1-3  
**Spec:** §§2.3, 15 (engine-relevant)  

---

## Intent

Characterization / pure unit suite for evaluate + expand — no HTTP required.

---

## Read first

1. Plan §9 test matrix (engine rows)  
2. Spec §15 items 2–4, 11  
3. `server/tests/` conventions  

---

## Files in scope

- `server/tests/test_access_control_engine.py` (or split modules)  

## Out of scope

Admin API tests (AC2-4); lesson matrix (AC3-5); UI.

---

## Required cases

| Case | Expect |
|------|--------|
| `selected: [observer-trial]`, exact false, plan navigator | ALLOW via expand |
| same, exact true | DENY |
| alumni not auto-added by expand | expand set has no courses-alumni |
| min_role observer admits alumni role | ALLOW |
| plans-only Observer selection without min_role | alumni role alone does not get commercial expand credit |
| deny_plans + data-bearing | read/export floor, write DENY |
| grandfather course enrollment | ALLOW when enabled |
| deny_plans enrolled course | DENY (no grandfather) |
| admin no preview | ALLOW |
| time window outside + close_behavior deny | DENY time |
| no policy | type default (as-built open/gated behavior) |
| evaluate_many N keys | N decisions, one call path |

---

## Completion

- [ ] `cd server && .venv/bin/python -m pytest tests -q` green for new tests  
- [ ] Evidence: command + pass count  

## Feeds

→ AC1-G
