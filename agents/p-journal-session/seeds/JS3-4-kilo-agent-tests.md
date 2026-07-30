# Seed JS3-4-kilo-agent-tests — Agent tests

**Project:** p-journal-session  
**Primary:** Kilo  
**Reviewers:** Alpha · Mike  
**Phase:** J3  
**Prerequisite:** JS3-0 GO · JS3-1 · JS3-2  

## Goal

Validator corpus; phase silence; form fallback; isolation ×2.

## Files in scope

- `server/tests/test_journal_sessions.py`  

## Out of scope

Feature code (report only).

## Invariants

- Deterministic · flake ×2 · deny paths first-class  

## Completion criteria

- [x] Goal met with evidence  
- [x] Reviewers APPROVED  

## Feeds

→ JS3-G  

---

## Evidence (2026-07-30 — Kilo JS3-4 · Alpha · Mike co-sign)

### Verdict: **APPROVED**

### Coverage map

| Area | Tests |
|------|--------|
| Validator corpus expanded | `test_validator_corpus_expanded` + JS3-2 cases |
| Intraday silent (no absence Q) | `test_agent_intraday_silent_no_question` |
| Form fallback / double-fail | JS3-2 + depth/clean_day |
| Isolation agent endpoints | `test_agent_isolation_cross_member` |
| Observer trial agent | `test_agent_observer_trial_can_run` |
| Depth status / D7 | status + attribution tests |
| Client cannot escalate author | `test_client_cannot_post_agent_author_via_messages` |
| Mode off fail loud | `test_agent_off_fail_loud` |

### Flake check ×2

```
$ pytest tests/test_journal_sessions.py -q
=== RUN 1 ===  49 passed in 0.69s
=== RUN 2 ===  49 passed in 0.66s
```

### Alpha co-sign

Agent API contracts covered; phase silence correct.

### Mike co-sign

Isolation 404 on agent routes; no author escalation; trial parity; form fallback never inserts bad turns.
