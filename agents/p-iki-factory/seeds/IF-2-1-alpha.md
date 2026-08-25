# IF-2-1 — Registry + research window (Alpha)

**GO IF-2.**

`migrations/138_iki_factory_research.sql`: `iki_factory_skills (skill_id, version, status)` + card fields (findings, window, rank, sources, remainder).  
Pickup: empty registry → `blocked_reason` truthful, no child cards, no pad to 10.  
Window 24 h from pickup; expiry is a visible block. Invoke only registered versions. Materialize ≤10 children; remainder on parent.

## Out of scope

A named production skill (Coach has not named one). Launchd. IF-3 conveyor.

## Completion

Kilo: empty registry fail-loud; unregistered invoke rejected; no padding.
