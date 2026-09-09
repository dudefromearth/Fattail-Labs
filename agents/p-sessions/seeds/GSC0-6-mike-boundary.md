# GSC0-6 — Mike · Auth boundary

**Project:** p-sessions  
**Callsign:** Mike  
**Depends:** —  
**Feeds:** GSC0-G · GSC3-2  
**Invariants:** Client never trusted for data · no new policy · Observer via existing `access_role` · secrets not logged

## Files in scope

| File | Touch |
|------|--------|
| `web/lib/useIsAdmin.ts` · `server/appearance.py` (`ALLOWED_MEMBER_HREFS`) | Read |
| `agents/p-sessions/evidence/mike-boundary.md` | **Write** |

## Out of scope

New SSO issuers. New membership slug. Implementation.

## Task sequence

1. Confirm `ft_session` + `/api/auth/me` (`fetchMe`) is enough.  
2. Observer trial = existing elevation.  
3. Appearance allowlist: child of Resources vs one-line href. Name the line only if required.  
4. AT-GSC-30: `/api/auth/me` exactly once; not on date change.

## Completion

`evidence/mike-boundary.md`. Allowlist: none **or** one exact href. No new policy.
