# GP-W0 — OPF Generation Plane

**ID:** `GP-W0`  
**Plan:** [`docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md`](../../docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md) — **v1.1 + errata E1–E3**  
**Errata:** [`docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md`](../../docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md)  
**Origin v1.1 (unmodified landing):** `docs/OPF Generation Plane Spec v0.2.2 — Full Agent Bench Plan v1.1.md`  
**Law:** Generation Plane Spec **v0.2.2** INDIA-SIGNED **with GP21 erratum** — [`Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md`](../../Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md)  
**Board:** `agents/p-opf-generation-plane/`  
**Evidence:** `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md`

**Status:** **not stamped.** Stamp **v1.1 + this errata**, the way India signed spec v0.2 + v0.2.1. No product code until W0-0 + W0-G.

---

**GP1** Server-owned generations only for analytics.  
**GP1a** Pricing what-if POST path stays.  
**GP2b** Namespaced store: `owned` vs `supplied`.  
**GP3 / GP4** Wings ladder unchanged; listed writer is separate.  
**GP7** No wing-window value labelled chain GEX.  
**GP11** Hydrator in-process. Never Massive.  
**GP18** Listed key `mb:ladder:{ul}:{exp}:listed:dual`.  
**GP21 (erratum)** Plane interest is **wings-only**. Listed pairs are **not** registered as interest. The listed writer pulls itself.  
**GP23** `--workers` = 1 while store is process-local.  
**OD-GP1** Archive = StudioOne. No `archive_put`.  
**OD-GP2** `STORE_MAX_STALE_MS` 20000. No code default.

**E1** `plane_interest.py` reads `LABS_OPF_PLANE_WINGS_TOPICS` only.  
**E2** P1b-G with empty wings topics is `BLOCKED`, not `FAIL`.  
**E3** New code uses `bus_ladder_key()`. `chain_feed.py` inline `w{wings}` is recorded, not fixed.

---

## Coach ticks (required before P1a / P2-0)

**OD-GP3 — host (same GO as P1a)**

- [ ] **StudioTwo** *(recommended — Redis already answers `PONG`; P1a is configuration)*  
- [ ] MiniTwo in P1a  
- [ ] Both (StudioTwo P1a, MiniTwo P1c)

**AT-GP22 ownership**

- [ ] **`keys.py` lands in P2 as `P2-0`, gated on AT-GP22 alone; P4 keeps AT-GP22 as a regression check.** *(plan default)*  
- [ ] Keys stay in P4 — then AT-GP22 is removed from P2-G

**DL-539 — three successive OKs** for plan §8 allowlist (`keys.py` P2-0, `generation.py`, `config.py`, `pricing.py`, `main.py`, Arch 30, DL, `infra/deploy.md`)

- [ ] OK 1  
- [ ] OK 2  
- [ ] OK 3  

Until three boxes, **P2-0 and P2 do not start.** P0, W0, and **P1a (infra)** do not edit those files. **P1b is product code** (`plane_interest.py` is **new**, not on the allowlist) — still waits on W0-G.

**B4 — missing cites** (`docs/OPF-REFERENCE-v1_1.md`, L4-A v0.4)

- [x] P0 reports only; W0 substitutes GXA0 + spec §2/§10 *(plan default)*  
- [ ] Coach names those docs as P0 authoring

**GP21 erratum**

- [ ] Accept: plane interest is wings-only; listed pairs need no interest  

**Env discipline (belt-and-braces behind E1)**

> P1b ships with `LABS_OPF_LISTED_PAIRS` unset and the listed writer disabled.

---

## Stamp block

```
W0-0 STAMP
Date:
Spec v0.2.2 BUILD AUTHORITY:
GP21 erratum (wings-only interest):
Plan v1.1 + errata E1–E3:
OD-GP3:
AT-GP22 ownership:
DL-539 OKs: 0/3
W0-G:
Implementation: blocked until W0-0 plus W0-G
```
