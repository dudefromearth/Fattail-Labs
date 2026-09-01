# Seed P0-1 — Lima Arch 30 honesty

**Project:** OPF Generation Plane  
**Agent:** Lima  
**Depends:** W0-G PASS  
**Law:** spec §10 · doctrine §9 · Coach Content Law  
**Files (declare):** `Architecture/30-options-pricing-foundation.md` · `Architecture/00-decision-log.md` · optionally a stub pointer beside the spaces spec filename  
**Out:** inventing `docs/OPF-REFERENCE-v1_1.md` or L4-A v0.4 unless GP-W0 B4 ticked · product code

## Ask

Truth change, not a rewrite of Coach intent:

1. Arch 30 §10 TTL is **seconds**, not hours (cite `LABS_MB_CHAIN_TTL_S` default 2 → Redis EX 6).
2. §11 / §3 “server L2–L4 SoR for multi-worker” is **false** while `ContractStore` is process-local.
3. §4 topology: chain_feed → Redis → API is **not running on MiniTwo** as of GXA0 (2026-09-01).
4. §6.1 pagination has **no OPF caller** until GP16.
5. §12 Redis is not L1; L1 is the in-process store (P2 will hydrate it).
6. §17b archive empty; AT count 19→**20**.
7. `pricing.py:27` “or bus” — comment vs code.
8. `chain_feed --symbol` unused.
9. §14 L5 already wired via Analyzer package-quote (GP1a).
10. §9 interest budget is per-process.
11. **GP18a erratum:** spec's "one existing OPF module" is false; five are modified; `keys.py` is the listed-token module; `generation.py` is P2-1.
12. **GP21 erratum:** plane interest is **wings-only**. Listed pairs need no interest.
13. **`chain_feed.py:59–62` inline `w{wings}` f-string** — recorded, not fixed (errata §4). Not on the DL-539 allowlist.

DL same day. Hyphenated spec and plan v1.1 are the law paths. **Report** missing OPF Reference v1.1 and L4-A v0.4.

## Done when

Arch 30 and DL updated. India P0-2.
