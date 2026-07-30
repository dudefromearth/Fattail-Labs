# Seed J1-2 — Alpha Get-or-Create (blocked until GO)

**Project:** p-journal-session-v06  
**Agent:** Alpha  
**Depends on:** J1-1 · J0-0 GO  

---

## Intent

`POST /api/me/journal-sessions` for a date returns the single open session for that date
(get-or-create). Never inserts a second row. Closed dates still **409**.

---

## Files (declare before edit)

- `server/journal_session_domain.py`  
- `server/routes/journal_sessions.py`  
- `server/tests/test_journal_sessions.py`  

## Completion

- [ ] Two creates same date → same `id`  
- [ ] Closed date create → 409 + reason/link  
- [ ] List by date length ≤ 1  
- [ ] Suite green  

## Gate

Part of **JS6-1-G**.
