# Seed P2-1 — Alpha namespaced store

**Project:** OPF Generation Plane  
**Agent:** Alpha  
**Depends:** P2-0-G · **three DL-539 OKs** (already spent on `keys.py` at P2-0)  
**Law:** GP2 · GP2b · GP2c · GP5–GP6 · GP14 · OD-GP6 · OD-GP7 · AT-GP2,3,4,5,9,17,20,21  
**Files:** `server/opf/generation.py` · `server/routes/pricing.py` · `server/opf/store_read.py` (new) · tests  
**Out:** hydrator (P2-2) · listed writer · analytics compute · unnamespaced accessors · breaking GP1a

## Ask

1. `put`/`get`/`get_by_expiration` **require namespace**. No unnamespaced accessor.
2. `owned` key: `(chain_underlier, expiration, book, wings|None)`.
3. `supplied` key: `(identity_id, chain_underlier, expiration, wings)` — 60 s TTL, lazy sweep.
4. `_hydrate` writes `namespace="supplied"`, `source="client_body"`.
5. `health.generations_cached` counts **owned only** (AT-GP17).
6. `source` required on put (AT-GP3). `book` required for analytics usability (AT-GP5); owned writes stamp it.
7. `stale_ms` / `stale` vs `LABS_OPF_STORE_MAX_STALE_MS` (no code default — hydrator side).
8. **`server/opf/store_read.py`:** analytics-class helper **rejects** `namespace="supplied"` and `source ∈ {client_body, http_fill}` (AT-GP2). Declared in plan §8; this seed creates it.
9. AT-GP21: three entries coexist.
10. Existing 20 `test_opf_foundation.py` stay green (AT-GP20). Pricing tests that POST generations still work (GP1a).

Declare exact diffs before touching.

## Done when

Kilo P2-3 covers these ATs. Do not claim P2-G without P2-2.
