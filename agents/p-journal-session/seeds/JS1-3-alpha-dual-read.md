# Seed JS1-3-alpha-dual-read — Alpha: Dual-read notes

**Project:** p-journal-session  
**Primary:** Alpha  
**Reviewers:** India  
**Phase:** J1  
**Prerequisite:** JS0-0 GO · JS1-1 · JS1-2  

## Goal

Gather + any journal consumers still read member_tool_notes; map pre_market → tag.

## Files in scope

- `server/journal_session_domain.py` (dual-read helpers)  
- `server/retrospective_domain.py` (§6.5, activity, process, stretch)  
- `server/journey_scores.py` (routine meter D2)  
- `server/tests/test_journal_sessions.py`  

## Out of scope

Export/purge dual emit (JS6); UI calendar (JS1-4); cutover flag flip.

## Invariants

- Spec §2.1 union until cutover · never invent invalidation · identity isolation  

## Completion criteria

- [x] retro gather still finds pre_market notes; tests  
- [x] Reviewers APPROVED  

## Feeds

→ JS1-G · JS1-4 · JS1-5  

---

## Evidence (2026-07-30 — Alpha JS1-3 · India co-sign)

### Verdict: **APPROVED**

### Dual-read consumers wired

| Consumer | Behavior |
|----------|----------|
| §6.5 expected_vs_actual | Union legacy pre_market notes **+** sealed/partial `tag=pre_market` sessions (`source` field) |
| Process journal_days / notes count | Notes ∪ session rows / NY activity days |
| Activity dates (gaps) | Trades ∪ note days ∪ `session_started_at` NY days |
| What-worked journal stretch | Union session NY days |
| Journey routine meter (D2) | Trades ∪ journal notes ∪ session NY days |
| Persistence weeks | Session NY weeks included |

### Intent extraction (sessions)

- `structured` confirmed fields only (format, no invent)  
- `pre_open` + `author=member` message bodies  
- Day key = `journal_date` for §6.5  

### Tests

```
$ pytest tests/test_journal_sessions.py tests/test_retrospectives.py -q
46 passed
```

New: dual-read session → EVA · legacy note still works · routine day helper.

### India co-sign

Matches Spec §2.1 SoR. Legacy path preserved (no cliff). Sessions partial|sealed only for §6.5. D2 uses session_started_at NY. No invalidation invention.
