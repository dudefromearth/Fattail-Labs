# Seed W0-6 — Tango visibility copy

**Project:** OPF Generation Plane  
**Agent:** Tango  
**Depends:** W0-0  
**Law:** GP7 · GP15 · GP22a · North Star / capacity-over-dependency  
**Out:** chrome · profit claims · “the market is quiet” for Redis down

## Ask

Visibility states are `present | stale | cold | broken`. Confirm member-facing meaning:

- **empty / cold** — no owned generation. Not an outage.
- **stale** — we have a book, it is old, we say so. Last known is not a lie.
- **broken** — bus down / misconfigured. Must not read as a quiet tape.
- **present** — owned, not past max-stale.
- A `wings` book is never copy-called **chain GEX**.

No chrome in this GO. This is the JSON envelope and any operator/member string on that route.

## Done when

Review in `agents/p-opf-generation-plane/reviews/W0-6-tango.md`.
