# Seed RT5-1 — Alpha + Mike: Agent analyze endpoint

**Project:** p-retrospective  
**Primary:** Alpha · Mike  
**Reviewers:** India · Hotel · Tango  
**Phase:** R5  
**Prerequisite:** RT5-0 GO  

## Goal

`POST /api/me/retrospectives/{id}/analyze`:

1. Fail loud if agent config missing  
2. Validate anchors non-empty; reject P&amp;L-only hypotheses  
3. Sample gate: trades &lt; 20 suppress outcome-corroborated hypotheses  
4. Symmetry: what_worked required when data exists  
5. Isolation single identity  
6. Entitlement: default **not** free; trial agent **off** unless Coach opened  

## Out of scope

- Building full LLM product if not configured — stub + fail loud OK if Coach agrees  

## Completion criteria

- [x] Validation tests  
- [x] Mike · India · Hotel · Tango APPROVED  

## Feeds

→ RT5-2, RT5-3  

---

## Evidence (2026-07-29 — Alpha RT5-1)

### Shipped

| Item | Path |
|------|------|
| Domain | `server/retrospective_agent.py` — config, validate, local_analyze |
| Route | `POST /api/me/retrospectives/{id}/analyze` |
| Config | `LABS_RETRO_AGENT_MODE=local` enables; default off → **503** |
| Trial | Off unless `LABS_RETRO_AGENT_TRIAL=1` |

### pytest

```
tests/test_retrospective_agent.py + suite  50 passed (combined with habit/retro)
```

### Reviews

| Reviewer | Verdict |
|----------|---------|
| Mike | **APPROVED** — isolation; trial off; fail loud 503 |
| India | **APPROVED** — Spec §8 boundary validation |
| Hotel | **APPROVED** — sample gate suppresses outcome corroboration |
| Tango | **APPROVED** — no profit promises; process-only plans |
