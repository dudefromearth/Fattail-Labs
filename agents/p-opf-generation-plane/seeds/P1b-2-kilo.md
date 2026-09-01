# Seed P1b-2 — Kilo AT-GP23 (wings interest)

**Project:** OPF Generation Plane  
**Agent:** Kilo  
**Depends:** P1b-1  
**Law:** AT-GP23 · errata E2  

## Ask

With the plane on and **no member watching**, and **at least one wings topic configured**:

- Topic returned **unmodified** by `list_interest_topics("mb:ladder:")`
- `chain_feed.tick` does not idle
- `mb:ladder:*` key **and** an `mb:pub` message exist

If `PLANE_WINGS_TOPICS` is empty: record **BLOCKED** (configuration gap), not FAIL.

**SSR live-capture must be unloaded.** If `mb:interest:*` is held by SSR, AT-GP23 is invalid — that is GP21's point.

## Done when

Evidence. Delta P1b-G.
