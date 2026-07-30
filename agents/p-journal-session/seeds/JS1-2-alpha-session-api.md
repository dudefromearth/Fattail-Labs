# Seed JS1-2-alpha-session-api — Alpha: Session API

**Project:** p-journal-session  
**Primary:** Alpha  
**Reviewers:** India  
**Phase:** J1  
**Prerequisite:** JS0-0 GO · JS1-1  

## Goal

CRUD + seal/partial; multi entry/date; no reopen 409; entitlement Observer=Navigator; free 403.

## Files in scope

- `server/journal_session_domain.py`  
- `server/routes/journal_sessions.py`  
- `server/main.py` (router include)  
- `server/tests/test_journal_sessions.py`  

## Out of scope

Dual-read gather (JS1-3); calendar UI (JS1-4); agent (J3); media (J5).

## Invariants

- identity_id from cookie only · D6 create gate · no MSC · sealed no reopen  

## Completion criteria

- [x] curl/create-list-get-seal; isolation (pytest)  
- [x] Reviewers APPROVED  

## Feeds

→ JS1-3 · JS1-4 · JS1-5  

---

## Evidence (2026-07-30 — Alpha JS1-2 · India co-sign)

### Verdict: **APPROVED**

### API surface

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/me/journal-sessions` | list; `journal_date`, `status`, `limit` |
| POST | `/api/me/journal-sessions` | create; tag + journal_date; entitlement |
| GET | `/api/me/journal-sessions/{id}` | get + messages |
| PATCH | `/api/me/journal-sessions/{id}` | structured_json before seal |
| POST | `.../messages` | member only (J1) |
| POST | `.../seal` | status=sealed; no reopen |
| POST | `.../partial` | interruption |

### Behavior

| Rule | Implementation |
|------|----------------|
| Multi entry/date | Allowed (no unique on date) |
| No reopen | sealed → 409 on message/patch/seal |
| Free no-plan | 403 CREATE_DENY_DETAIL |
| Observer-trial | create OK (D6) |
| Isolation | other member's id → 404 |
| Body identity_id | ignored |
| retrospective tag | 422 navigate-only |
| Closed date | 409 |
| Phase | derive_phase interim US RTH NY |

### Tests

```
$ cd server && .venv/bin/python -m pytest tests/test_journal_sessions.py -q
10 passed in 0.22s
```

Coverage: create/list/get/message/seal · multi · isolation · free 403 · trial OK ·
retro tag 422 · closed 409 · identity ignore · partial→seal · phase unit.

### India co-sign

Domain matches Spec §5 tags, §6 multi-entry/seal, §10 closure 409, D6 entitlement
reuse of `can_create_or_gather`. Schema columns only from §14. No dual-read yet
(JS1-3). Agent path correctly out of J1.
