# GP-W0 — OPF Generation Plane

**ID:** `GP-W0`  
**Working law (this GO):** spec `v0.2.2` + bench plan **as folded at `374ed86`**. Reference by commit, not by version string.  
**Plan path at that commit:** `docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md`  
**Errata path at that commit:** `docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md`  
**Law:** [`Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md`](../../Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md)  
**Board:** `agents/p-opf-generation-plane/`  
**Evidence:** `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md`

**Status:** **W0-0 STAMP 2026-09-01. W0 in progress → W0-G.** Authorized scope: **W0 only**. P0 does not start on this GO.

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

## Coach ticks (W0-0 2026-09-01)

**OD-GP3 — host (same GO as P1a)**

- [x] **StudioTwo** — Coach W0-0. Evidence: `agents/p-opf-generation-plane/evidence/studio-two-2026-09-01-od-gp3.md`. MiniTwo stays `bus: "not_configured"` by law until a later Foxtrot packet. Wings-compute capability is **not** claimable on the member host until that packet lands.  
- [ ] MiniTwo in P1a  
- [ ] Both (StudioTwo P1a, MiniTwo P1c)

**AT-GP22 ownership**

- [x] **`keys.py` lands in P2 as `P2-0`, gated on AT-GP22 alone; P4 keeps AT-GP22 as a regression check.** *(plan default — Coach W0-0)*  
- [ ] Keys stay in P4

**DL-539 — three successive OKs** for plan §8 allowlist (`keys.py` P2-0, `generation.py`, `config.py`, `pricing.py`, `main.py`, Arch 30, DL, `infra/deploy.md`)

- [x] OK 1 — Coach W0-0 2026-09-01  
- [ ] OK 2  
- [ ] OK 3  

**The §8 allowlist stays untouched** until the third OK. No edit to `generation.py`, `keys.py`, `config.py`, `routes/pricing.py`, or `main.py`. P2-0 does **not** start on this GO.

**B4 — missing cites** (`docs/OPF-REFERENCE-v1_1.md`, L4-A v0.4)

- [x] P0 reports only; W0 substitutes GXA0 + spec §2/§10 *(plan default; this GO)*  
- [ ] Coach names those docs as P0 authoring

**W0-1 substitution (Lima, recorded on this token):**  
`docs/OPF-REFERENCE-v1_1.md` is **absent**. W0 reviewers substitute `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md` plus spec §2 and §10. **Do not author the Reference or L4-A v0.4.**

**GP21 erratum**

- [x] Accept: plane interest is wings-only; listed pairs need no interest *(folded at `374ed86`; Coach stamp)*

**Env discipline (belt-and-braces behind E1)**

> P1b ships with `LABS_OPF_LISTED_PAIRS` unset and the listed writer disabled.

---

## Stamp block

```
W0-0 STAMP
Date: 2026-09-01
Commit: 374ed86
Spec v0.2.2 BUILD AUTHORITY: YES
GP21 erratum (wings-only interest): Accept
Plan as folded at 374ed86: Accept
OD-GP3: StudioTwo (MiniTwo stays not_configured)
AT-GP22 ownership: plan default (keys.py = P2-0)
DL-539 OKs: 1/3  (OK 1 recorded; 2 and 3 pending; §8 allowlist untouched)
B4: report-only; W0-1 substitution in force
Authorized: W0 only. P0 does not start on this GO.
W0-G: PASS 2026-09-01 (see agents/p-opf-generation-plane/gate-reports/W0-G.md)
Implementation: W0 complete. P0 not authorized. P1a/P2-0 not authorized (P0 unrun; DL-539 1/3).
```
