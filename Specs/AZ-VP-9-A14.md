# Amendment AZ-VP-9-A14 — Fonts, Controls, and Local-Feel Performance

**Date:** 2026-09-18
**Authority:** Coach directive (reconciliation session): fonts similar
to the TV benchmark; settings for scales left/right and the VP
left/right; dropdown intervals; and performance as if all the data
is local — smart optimistic data delivery.
**Extends:** A2, A4, A6, A10, A13. Nothing struck.

## Fonts (extends A13)

1. Typography matches the TV benchmark family: the axis labels,
   chips, and dialogs use the same clean sans/mono pairing the
   benchmark shows (crisp light-on-dark axis figures); exact faces
   are theme config Coach tunes on screen; "reads like the
   benchmark" is the test.

## Control placement (homes for existing law)

2. The PRICE-SCALE settings dialog (A10, opened by clicking the
   scale) hosts: scale side — left / right / both (A2.3/A4.1).
3. The PROFILE layer dialog hosts: VP anchor — left / right
   (A2.4/A12.1).
4. INTERVAL DROPDOWN: the A6 timeframe set (1m/5m/15m/1h/1d) as a
   dropdown in the utility bar — one click, TV-style; persisted
   per user.

## Local-feel performance (the new law)

5. **Perceived-local interaction:** pan, zoom, layer toggles,
   anchor/scale changes, and interval switches respond immediately
   (~100 ms feel) from client state — never spinner-first.
6. **Generation-keyed caching:** payloads are immutable per
   profile_generation_id / parameter hash, so they cache
   indefinitely and invalidate precisely on a new generation.
   Transport uses ETag = generation id end to end (API, MiniTwo
   backend proxy, client) — a transport behavior, no contract
   schema change.
7. **Smart prefetch:** on idle, prefetch the adjacent timeframes,
   adjacent x-spans, and the alternate anchor's needs; background
   watch (lightweight /health or generation check) refreshes the
   developing payload only when its generation advances.
8. **Optimistic, never invented:** optimistic rendering shows REAL
   cached data instantly and reconciles to the authoritative
   payload; uncovered spans render as honest loading edges, never
   fabricated bars; data staler than its TTL carries the STALE
   badge pattern. The honesty laws outrank the speed laws at every
   collision.
9. Cold start is the only permitted skeleton; after first paint,
   navigation within the product never blanks the canvas.

## Standing

Citable law until folded into the SA spec's next authored version.
Surface and delivery work bind to A14 from this date.
