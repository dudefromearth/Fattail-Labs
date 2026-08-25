# IF-1-2 — Schema + domain (Alpha)

**GO IF-1.** Depends on IF-1-0, IF-1-1.

## In scope

`migrations/137_iki_factory.sql` — cards + append-only transitions. **Not** `content_items`.  
Fields: lane, priority (low/medium/high), owner, Hold, blocked/failed reason, auto-move reason, waiting reason, lineage parent, `plan_ref` (approval field, empty in IF-1), spec_ready / built_ready, product/help placeholders.  
`server/iki_factory.py` — create Idea → pickup stub Ideas→Research; move validator per IF-1-0.  
Mount router in `server/main.py`.

## Out of scope

Skill runner. Woo. Wiki emit. `gemba.md`. Runner registry.

## Completion

Create Idea → Research with visible auto-move reason. Invalid moves 422 + card stays + reason.  
