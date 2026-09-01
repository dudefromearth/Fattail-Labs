# Seed P1b-1 — Alpha plane interest (wings-only)

**Project:** OPF Generation Plane  
**Agent:** Alpha  
**Depends:** P1a-G · W0-G  
**Law:** GP21 **erratum** · errata E1 · E3 · AT-GP23  
**Files:** `server/opf/plane_interest.py` (new) · `server/main.py` (lifespan/start only if required) · tests  
**Out:** reading `LABS_OPF_LISTED_PAIRS` · constructing a listed topic · decorating `mb:interest:` keys · inline f-string keys · hydrator · `keys.py` · **loading or relying on `ssr-live-capture`**

## Ask

1. Heartbeat shorter than the 45 s grace (default 15 s) for **`LABS_OPF_PLANE_WINGS_TOPICS` only**.
2. **Does not read `LABS_OPF_LISTED_PAIRS` and does not construct a listed topic (E1).** `LISTED_PAIRS` belongs to P4.
3. Same `mb:interest:{topic}` key the member path writes. Attribution in sidecar `mb:interest_src:{topic}` or `held_by`. **Never a decorated topic.**
4. New topic strings via **`bus_ladder_key()` only** (E3). Do not copy `chain_feed.py`'s inline f-string.
5. Stops when the plane is disabled — no orphaned interest.
6. Empty `PLANE_WINGS_TOPICS` is a correct no-op (default). That is not a code failure.
7. Belt-and-braces: ship with `LABS_OPF_LISTED_PAIRS` unset.

## Done when

Kilo P1b-2. Delta P1b-G: if no wings topic is configured, **BLOCKED** not FAIL (E2).
