# Seed JS3-1-alpha-mike-agent — Agent interview API

**Project:** p-journal-session  
**Primary:** Alpha · Mike  
**Reviewers:** India · Tango · Hotel  
**Phase:** J3  
**Prerequisite:** JS3-0 GO  

## Goal

Interview endpoint; Appendix A prompt constant; depth ≤8; service attribution D7.

## Files in scope

- `server/journal_session_agent.py` (new)  
- `server/journal_session_domain.py` (`append_agent_message`)  
- `server/routes/journal_sessions.py`  
- `server/tests/test_journal_sessions.py`  

## Out of scope

Full turn validator corpus (JS3-2); chat UI (JS3-3).

## Invariants

- Mode fail loud · D7 server-set attribution · D8 depth · form fallback · Family B  

## Completion criteria

- [x] Goal met with evidence  
- [x] Reviewers APPROVED  

## Feeds

→ JS3-2  

---

## Evidence (2026-07-30 — Alpha · Mike JS3-1 · India · Tango · Hotel co-sign)

### Verdict: **APPROVED**

### Deliverables

| Item | Detail |
|------|--------|
| Config | `LABS_JOURNAL_AGENT_MODE=local\|off` (default off, fail loud 503) |
| Prompt | `JOURNAL_SESSION_SYSTEM_PROMPT_V1` = Appendix A full text |
| D7 | `append_agent_message` sets `author=agent`, `agent_service=labs-journal-session` |
| Depth | pre_market/post_session ≤8; clean_day 1; reflection 2 |
| Local interviewer | Checklist-driven absence probes (Hotel priority for pre_market) |
| Confirm | `[confirm]` restatement outside D8 budget |
| Intraday | `[silent]` no questions |
| API | `GET …/agent`, `POST …/agent/turn` |
| Form fallback | 409 depth_exhausted + form_fallback flag |

### Mike co-sign

Client cannot set author/agent_service; isolation via session owner; entitlement D6.

### Hotel co-sign

Invalidation first probe; no invent; local questions are absence-only.

### Tango co-sign

Prompt is Appendix A; form fallback copy path reserved; no grade language in agent module errors.

### India co-sign

Domain boundary clean; no MSC; schema unchanged.

### Tests

```
$ pytest tests/test_journal_sessions.py -q
38 passed
```
