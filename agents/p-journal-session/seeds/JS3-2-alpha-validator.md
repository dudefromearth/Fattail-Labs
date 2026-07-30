# Seed JS3-2-alpha-validator — Turn validator

**Project:** p-journal-session  
**Primary:** Alpha  
**Reviewers:** Mike  
**Phase:** J3  
**Prerequisite:** JS3-0 GO · JS3-1  

## Goal

Block before render; one retry; double-fail → J2 form (not dead partial).

## Files in scope

- `server/journal_session_validator.py` (new)  
- `server/journal_session_agent.py` (wire validate + form fallback)  
- `server/tests/test_journal_sessions.py`  

## Out of scope

Chat UI (JS3-3); LLM provider path.

## Invariants

- Never insert violating agent turn · form always available · no dead partial  

## Completion criteria

- [x] Goal met with evidence  
- [x] Reviewers APPROVED  

## Feeds

→ JS3-3 · JS3-4  

---

## Evidence (2026-07-30 — Alpha JS3-2 · Mike co-sign)

### Verdict: **APPROVED**

### Validator blocks (§8.2)

| Code | Content class |
|------|----------------|
| motive_or_emotion | fear/greed/revenge/hesitation about member |
| advice | you should / recommend |
| praise_or_blame | good trade / you failed |
| pnl_figure | $ / PnL / profit of |
| grade_meter_streak_score | grade/meter/streak |
| multi_question | >1 `?` or numbered list |
| chart_or_price_claim | chart shows / image |
| brevity_request | be brief / summarize |

### Path

1. Generate candidate turn  
2. Validate — if ok → insert (D7)  
3. If fail → **one** safe fallback retry  
4. If second fails → **form_fallback** payload, **no** agent message row  

### Mike co-sign

Violating text never persisted; form_fallback explicit; isolation unchanged.

### Tests

```
$ pytest tests/test_journal_sessions.py -q
42 passed
```

Includes: corpus blocks, retry-then-accept, double-fail no insert.
