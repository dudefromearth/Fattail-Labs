# J3-1 — Recovery prefs server-side (F3)

**Agents:** India · Alpha · Mike · Kilo  
**Phase:** J  

## Intent

Dismiss state for recovery invite = **server profile prefs** (JSON on identities). Family B. No localStorage.

## Files

- `migrations/099_*.sql` (journey_ui_prefs_json or similar)  
- `server/routes/member.py` profile GET/PATCH  
- Tests Mike + Kilo  

## Done when

- [ ] Prefs round-trip  
- [ ] Multi-device (server)  
