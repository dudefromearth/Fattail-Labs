# Seed JS2-1-alpha-india-structured — Structured schema

**Project:** p-journal-session  
**Primary:** Alpha · India  
**Reviewers:** Hotel  
**Phase:** J2  
**Prerequisite:** JS1-G PASS  

## Goal

structured_json per tag; required checklist code-owned; prefill from trade log/prior plan.

## Files in scope

- `server/journal_session_structured.py` (new)  
- `server/journal_session_domain.py`  
- `server/routes/journal_sessions.py`  
- `server/tests/test_journal_sessions.py`  

## Out of scope

Form UI (JS2-2); agent (J3).

## Invariants

- Spec §5 / §5.1 · never invent invalidation · Hotel risk framing  

## Completion criteria

- [x] Goal met with evidence  
- [x] Reviewers APPROVED  

## Feeds

→ JS2-2 · JS2-3  

---

## Evidence (2026-07-30 — Alpha · India JS2-1 · Hotel co-sign)

### Verdict: **APPROVED**

### Deliverables

| Item | Detail |
|------|--------|
| Schemas | `pre_market`, `post_session`, `clean_day`, `reflection` field specs |
| Checklist | `checklist_status` · `required_for_complete` · invalidation load-bearing |
| Uncertainty | “I don't know” etc. satisfy invalidation for complete seal |
| Normalize | Unknown keys dropped; empty → absent |
| Prefill | Prior sealed plan instrument/size_risk + same-day trade underliers; **never** invalidation |
| API | `GET …/schemas`, `…/schema?tag=`, `…/prefill?tag=&journal_date=` |
| Create | `prefill: true` merges; member structured wins |
| Seal | `require_complete: true` → 422 if checklist incomplete; soft seal still OK |
| Serialize | Every session includes `checklist` |

### Hotel co-sign

| Check | Verdict |
|-------|---------|
| Invalidation required for complete pre_market | **PASS** |
| Never invent / never prefill invalidation | **PASS** |
| Uncertainty > false precision | **PASS** |
| Size/risk not invented from P&L | **PASS** |
| Risk framing in field hints | **PASS** |

### India co-sign

Single code checklist SoR for form + future agent; aligns §5.1; no schema migration needed (JSON).

### Tests

```
$ pytest tests/test_journal_sessions.py -q
26 passed
```
