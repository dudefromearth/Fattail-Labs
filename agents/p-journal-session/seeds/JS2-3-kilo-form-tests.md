# Seed JS2-3-kilo-form-tests — Form tests

**Project:** p-journal-session  
**Primary:** Kilo  
**Reviewers:** Alpha  
**Phase:** J2  
**Prerequisite:** JS1-G PASS · JS2-1  

## Goal

Absent fields not inferred; confirm writes structured only; ×2.

## Files in scope

- `server/tests/test_journal_sessions.py`  

## Out of scope

Feature code (report only).

## Invariants

- Deterministic · flake ×2 · never invent  

## Completion criteria

- [x] Goal met with evidence  
- [x] Reviewers APPROVED  

## Feeds

→ JS2-G  

---

## Evidence (2026-07-30 — Kilo JS2-3 · Alpha co-sign)

### Verdict: **APPROVED**

### Coverage (J2 form)

| Case | Test |
|------|------|
| Skipped fields absent after complete seal | `test_skipped_fields_remain_absent_on_seal` |
| PATCH writes structured only (no msgs/agent) | `test_confirm_patch_writes_structured_only` |
| Full checklist complete seal | `test_complete_seal_with_full_checklist` |
| Empty strings → absent | `test_empty_string_fields_become_absent` |
| require_complete fail → patch → pass | `test_require_complete_fails_then_succeeds_after_patch` |
| Other tag schemas | `test_post_session_and_reflection_schemas` |
| Schemas catalog | `test_schemas_all_endpoint` |
| Prefill never invalidation (JS2-1) | retained |
| Unknown keys dropped | retained |

### Flake check ×2

```
$ pytest tests/test_journal_sessions.py -q
=== RUN 1 ===  33 passed in 0.55s
=== RUN 2 ===  33 passed in 0.48s
```

### Alpha co-sign

Form path matches JS2-1 domain contracts; seal gate behavior correct.
