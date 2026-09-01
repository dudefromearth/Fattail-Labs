# GP-W0 — OPF Generation Plane

**ID:** `GP-W0`  
**Plan:** [`docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.0.md`](../../docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.0.md) **v1.0**  
**Law:** Generation Plane Spec **v0.2.2** INDIA-SIGNED — [`Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md`](../../Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md)  
**Board:** `agents/p-opf-generation-plane/`  
**Evidence:** `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md`

**Status:** **not stamped.** India-signed is not BUILD AUTHORITY. No product code until W0-0 + W0-G.

---

**GP1** Server-owned generations only for analytics.  
**GP1a** Pricing what-if POST path stays.  
**GP2b** Namespaced store: `owned` vs `supplied`.  
**GP3 / GP4** Wings ladder unchanged; listed writer is separate.  
**GP7** No wing-window value labelled chain GEX.  
**GP11** Hydrator in-process. Never Massive.  
**GP18** Listed key `mb:ladder:{ul}:{exp}:listed:dual`.  
**GP21** Plane-owned interest. Feed does not idle.  
**GP23** `--workers` = 1 while store is process-local.  
**OD-GP1** Archive = StudioOne. No `archive_put`.  
**OD-GP2** `STORE_MAX_STALE_MS` 20000. No code default.

---

## Coach ticks (required before P1 / P2)

**OD-GP3 — host (same GO as P1)**

- [ ] StudioTwo first  
- [ ] MiniTwo in P1  
- [ ] Both (StudioTwo P1a, MiniTwo P1b)

**DL-539 — three successive OKs** for plan §8 allowlist (`generation.py`, `keys.py`, `config.py`, `pricing.py`, `main.py`, Arch 30, DL, `infra/deploy.md`)

- [ ] OK 1  
- [ ] OK 2  
- [ ] OK 3  

**B4 — missing cites** (`docs/OPF-REFERENCE-v1_1.md`, L4-A v0.4)

- [x] P0 reports only *(plan default until Coach ticks otherwise)*  
- [ ] Coach names those docs as P0 authoring

---

## Stamp block

```
W0-0 STAMP
Date:
Spec v0.2.2 BUILD AUTHORITY:
Plan v1.0:
OD-GP3:
DL-539 OKs: 0/3
W0-G:
Implementation: blocked until W0-0 plus W0-G
```
