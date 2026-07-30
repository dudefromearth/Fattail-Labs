# J1 progress — composer-first UI (interim)

**Date:** 2026-07-30  
**Status:** LANDED (UI substrate) — formal **J1-G** still open until schema dual-read + Kilo suite items closed  
**Spec:** Journal Session v0.5 BUILD AUTHORITY (DL-160)

## Evidence

### Day view (Charlie / Echo)

- Empty day: composer only; **first send** creates open session + posts member message (agent turn preferred; plain message fallback).
- Dual free-text "Write" path removed (conversation is the journal).
- No tag-chip wall; **JournalTagsControl** compact → list window.
- Structured interview collapsed bar by default (`journal-interview-toggle`).
- Dedicated **Open retrospective** action (not a tag).
- Multi-entry: **New entry** deselects active so empty composer can start another.

### Agent chat surface

- Member always first (auto-bootstrap probe removed).
- Composer remains when model/agent unavailable; plain `POST …/messages` captures notes (Spec §8.4).
- No question counters / phase names in member transcript chrome.

### Tags (J4)

- Closed session assign APIs return **409**.
- Test: `test_closed_journal_session_refuses_tag_changes`.

### Agent context (J2 partial)

- LLM turn injects Tag Manager **labels** as description only.

### Verification

```
cd server && .venv/bin/python -m pytest tests/test_journal_sessions.py tests/test_tags.py -q
# 60 passed

cd web && npx tsc --noEmit
# clean

npm run build && npm start  # rebuilt + restarted :3000
uvicorn main:app --port 4000  # restarted
```

## Remaining for formal J1-G / program

- J1-1 migration polish if any residual `tag` SoR paths remain product-visible
- J2 full guardrail corpus + RTH tests
- J3 prompt versions
- J6–J9 media, retro warnings, closure honesty, portability
