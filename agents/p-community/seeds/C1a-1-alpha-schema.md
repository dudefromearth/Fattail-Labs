# Seed C1a-1 — Alpha schema + app registration

**Agent:** Alpha  
**Depends on:** **C0-G PASS**  
**Spec:** §3 · §4.1 · §4.3–4.4 · §5  

## Declare before touch (update when starting)

Expected scope (adjust with India if needed):

- `migrations/NNN_community_*.sql` — channels, bot shares, apps seed  
- Domain module under `server/`  
- Routes under `server/routes/`  
- Characterization tests under `server/tests/`  

## Task

1. Tables: `community_channels` (+ unique slug; Discord map fields); bot shares as Spec.  
2. Seed channels: general, practice, strategy-lab, toughness — **no** journey/wiki.  
3. Register Apps hub row slug `community` → `/app/community`.  
4. Read APIs for channels + FatTail shelf (house designs) + member shares list.  
5. Fail loud on missing config if any required.  
6. Tests: seed count, uniqueness, no Journey/Wiki channel.  

## Out of scope

Discord OAuth, Gateway, message mirror (C1b/c).

## Completion

API curl evidence + pytest green. Feeds C1a Charlie shell seed + C1a-G.
