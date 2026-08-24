# SB0-6 — Client cache boundary

**Project:** Template Runner Stream Book  
**Agent:** Mike  
**Depends:** —  
**Feeds:** SB0-G

## In scope

- No new endpoint, secret, or cookie  
- RAM book + `localStorage` budget preference only  
- Preference is not a privilege escalation  
- Budget cannot be used to force the server to retain history  
- Confirm no chain dump off-box

## Out of scope

Code. IndexedDB (L4 B).

## Done

Boundary note: client-only, fail-loud if a server path appears in the file list.
