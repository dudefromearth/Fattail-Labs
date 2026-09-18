# Project: Options Lab Heatmap — GEX Calendar (`gex-cal`)

**Board:** `agents/p-options-lab-heatmap-gex-calendar/`  
**Instance:** **GROK BUILD — HEATMAP (GBH)** (**DL-747**)  
**Namespace:** **`HM*` / `OD-GC*`**  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Spec

| Doc | Path |
|-----|------|
| **GEX Calendar v0.1** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md) sha1 `36a347185aaece5c4b900bf22e9683ad4ffbaf6f` · **DRAFT** until **OD-GC1…GC4** stamped |
| Parent | Heatmap Templates v0.2.4 · frozen `gex` (`gex_v1`) · LIM v0.4.7 sibling (never fused) |

**Not BUILD AUTHORITY.** No seed fires until Coach Phase 5 and OD-GC1…GC4.

## Owns

Frozen **`gex_v1` generations**. Heatmap template id `gex-cal`. Route tree: Options Lab **heatmap** (not volume-profile).

## Does not

- `VPS*` / `VPSB*` / `SADEV*` namespaces  
- VP stores (`{LABS_MARKET_DATA_ROOT}/vp/`)  
- VP surfaces (`/app/options-lab/volume-profile`)  
- The VP program's future **heatmap overlay** (SA-edges consumer) — **distinct product**  
- Shared Labs component changes without Coach  
- Collector contention (collectors win)

## Conflicts

STOP, report to Coach. Never instance-to-instance.
