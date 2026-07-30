# Seed JS1-5-kilo-session-tests — Kilo: Session tests

**Project:** p-journal-session  
**Primary:** Kilo  
**Reviewers:** Alpha · Mike  
**Phase:** J1  
**Prerequisite:** JS0-0 GO · JS1-2 · JS1-3  

## Goal

Isolation, multi-entry, seal, free 403, dual-read characterization ×2.

## Files in scope

- `server/tests/test_journal_sessions.py`  

## Out of scope

Feature code (report only); J3 agent validator tests.

## Invariants

- Deterministic · deny paths first-class · flake check ×2  

## Completion criteria

- [x] pytest green ×2  
- [x] Reviewers APPROVED  

## Feeds

→ JS1-G  

---

## Evidence (2026-07-30 — Kilo JS1-5 · Alpha · Mike co-sign)

### Verdict: **APPROVED**

### Coverage map (Spec / plan)

| # | Case | Test |
|---|------|------|
| 1 | Isolation A≠B get/message/list | `test_isolation_404`, `test_isolation_list_does_not_leak` |
| 2 | Free 403 · trial OK · navigator OK | `test_free_observer_403`, `test_observer_trial_create_ok`, `test_navigator_create_ok`, unit matrix |
| 3 | Multi entry/date | `test_multi_entry_per_date` |
| 4 | Seal no reopen (msg/patch/seal/partial) | `test_create_list_get_message_seal`, `test_seal_blocks_patch_and_second_seal` |
| 5 | Closed date 409 | `test_closed_date_409` |
| 6 | Body identity ignored | `test_body_identity_ignored` |
| 7 | Dual-read session + legacy note | dual-read tests |
| 8 | Open session excluded from §6.5 | `test_open_pre_market_not_in_expected_vs_actual` |
| 9 | Phase unit · empty message 422 · unauth | unit + edge tests |
| 10 | List status filter · partial→seal | list + partial tests |

### Flake check ×2

```
$ cd server && .venv/bin/python -m pytest tests/test_journal_sessions.py -q
=== RUN 1 ===  21 passed in 0.39s
=== RUN 2 ===  21 passed in 0.34s
```

Retro regression: `tests/test_retrospectives.py` — **33 passed**.

### Alpha co-sign

API contracts match domain; dual-read open-exclusion correct.

### Mike co-sign

Isolation 404 (not 403 oracle); body identity ignored; entitlement deny paths covered; unauth denied.
