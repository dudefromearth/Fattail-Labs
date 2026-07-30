# RT07-8-G — Sequence agent + prompt versions (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS**

## Deliverable

### Schema
- `migrations/057_retrospective_prompt_versions.sql`
- Seed active: `RETROSPECTIVE_SEQUENCE_PROMPT_V1`
- Create stamps `member_retrospectives.prompt_version_id` (mirror Journal J3)

### Sequence agent (`retrospective_agent.py` · Spec §16)
- **Role:** `sequence_keeper` — holds nine-step order; one focus question per turn
- **Assembly only** — inventory from staged report; trader judgment
- **No prescription:** `habit_plans: []`; `meta.prescribes: false`
- **Code guardrails** (not admin-editable): motive/emotion diagnosis, advice, praise/blame, P&L figures in process copy, grade/streak while answering, prescription phrases
- `build_sequence_guide()` + `run_analyze()` produce sequence payload
- Analyze accepts `{ "focused_step": 1-9 }`

### Admin prompt store
- `GET/POST /api/admin/retrospective-prompts`
- `POST /api/admin/retrospective-prompts/{id}/activate`
- Prohibitions remain in code — prompt body is sequence instruction only

### Frontend
- Ceremony steps unchanged (anti-wizard)
- Sequence agent panel **outside** step order as assistive strip
- Shows focus turn + 9-step strip; prompt version stamp
- Copy: does not prescribe / does not diagnose

### Tests
```
pytest tests/test_retrospective_agent_sequence.py tests/test_retrospectives.py -q
# 55 passed
test_ceremony_steps_nine_ordered
test_guardrail_blocks_prescription
test_guardrail_blocks_diagnosis_and_pnl_figure
test_sequence_guide_no_habit_plans
test_run_analyze_sequence_local
test_create_stamps_prompt_version
test_ui_sequence_agent_source
```

### Evidence claims
| Claim | Evidence |
|-------|----------|
| Holds sequence, one question | `steps` ×9, `turn.question`, focused_step |
| No prescribe | empty `habit_plans`; guardrail bans |
| Prompt stamped | create + analyze set `prompt_version_id` |
| Anti-wizard | ceremony markers order unchanged; agent is separate panel |
| Guardrails in code | `assert_no_guardrail_violation` fails on ban phrases |

## Out of scope
- External LLM sequence (local mode only; same as prior agent mode)
- Member-authored habit plans still via habit-plans API (not agent-prescribed)
