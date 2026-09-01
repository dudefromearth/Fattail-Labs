# Seed P2-2 — Alpha in-process hydrator

**Project:** OPF Generation Plane  
**Agent:** Alpha  
**Depends:** P2-1 · P1b-G for **live** AT-GP1 (units may use fake Redis)  
**Law:** GP11–GP15 · GP23 · GP24 · AT-GP1,6,7,8,10,11,15a–c,19  
**Files:** `server/opf/hydrator.py` (new) · `server/opf/config.py` · `server/main.py` · tests  
**Out:** Massive in the hydrator · separate hydrator process · killing API on misconfig · `_env` empty-collapse for `PLANE_WINGS_TOPICS`

## Ask

1. FastAPI lifespan asyncio task in the API process (GP11).
2. Subscribe `mb:pub`; topic `mb:ladder:*` → `get_json` → `from_ladder_payload` → `put(namespace="owned")`. Stamp `source` (`bus` or `listed_writer` from envelope) and `book` from envelope — **do not infer**.
3. Backstop SCAN every `LABS_OPF_RECONCILE_INTERVAL_S` (default 30). AT-GP6: with publish suppressed, scan still hydrates.
4. Unchanged `content_hash` → no write. Older `as_of` never replaces newer.
5. Hold past Redis TTL; mark stale (AT-GP9). Never silent refresh.
6. Redis down → `broken` / `bus: down` (AT-GP10). Empty, stale, broken distinguishable.
7. Config: hydrator starts only when enabled **and** required keys set. `STORE_MAX_STALE_MS` unset → hydrator does not start (AT-GP15a). Listed pairs absent + listed writer off → no abort (AT-GP15b).
8. **Config helper distinguishing UNSET from SET-TO-EMPTY.** `opf.config._env` collapses `""` to the default, so `LABS_OPF_PLANE_WINGS_TOPICS=""` silently becomes the default without it (spec §9.2).
9. GP23: boot **fails loud** if workers > 1 while store is process-local (AT-GP19).
10. Three states `not_configured` / `misconfigured` / `down`; API serves a request in each (AT-GP11).
11. **Zero Massive calls** in hydrator (AT-GP1).
12. Do **not** register listed interest here — that is P1b and it is **wings-only**. Hydrator consumes whatever Redis already holds.

## Done when

Kilo P2-3. AT-GP1 live on P1 host.
