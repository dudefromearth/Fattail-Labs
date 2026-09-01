# Seed P1b-2 — Kilo AT-GP23 (wings interest)

**Project:** OPF Generation Plane  
**Agent:** Kilo  
**Depends:** P1b-1  
**Law:** AT-GP23 · errata E2  

## AT-GP23 precondition (P1a-FIX 2026-09-01 — verify BEFORE the test)

A member Options Lab tab on StudioTwo holds **I:SPX w25** interest. AT-GP23 must prove the **PLANE** holds interest, not a member. Running it while a member tab is open is invalid for exactly the reason SSR live-capture must stay unloaded — GP21's point.

P1b needs a **quiet window with no member watching**, verified before the test, not after.

Before AT-GP23:

1. No Options Lab tab open on StudioTwo (and no other member client holding ladder interest).
2. `launchctl print gui/$(id -u)/ai.fattail.labs.ssr-live-capture` → Could not find service.
3. SCAN `mb:interest:*` is empty, **or** every remaining key is attributable to the plane heartbeat (sidecar / `held_by`), not a member tab.

A `wrote mb:ladder:I:SPX:…` line from chain_feed while a member tab is open is **not** AT-GP23.

## Ask

With the plane on and **no member watching**, and **at least one wings topic configured**:

- Topic returned **unmodified** by `list_interest_topics("mb:ladder:")`
- `chain_feed.tick` does not idle
- `mb:ladder:*` key **and** an `mb:pub` message exist

If `PLANE_WINGS_TOPICS` is empty: record **BLOCKED** (configuration gap), not FAIL.

**SSR live-capture must be unloaded.** If `mb:interest:*` is held by SSR, AT-GP23 is invalid — that is GP21's point.

## Done when

Evidence. Delta P1b-G.
