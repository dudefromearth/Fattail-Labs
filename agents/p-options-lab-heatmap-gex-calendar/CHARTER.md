# Project: Options Lab Heatmap — GEX Calendar (`gex-cal`)

**Board:** `agents/p-options-lab-heatmap-gex-calendar/`  
**Instance:** **GROK BUILD — HEATMAP (GBH)** (**DL-747**)  
**Namespace:** **`HM*` / `OD-GC*`**  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Spec

| Doc | Path |
|-----|------|
| **GEX Calendar v0.1.1 DRAFT** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md) · **OD-GC4 LOCKED Term Mass** · **DRAFT** until **GC0-0** |
| **Bench plan v1.0** | [`docs/Options-Lab-Heatmap-Term-Mass-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Heatmap-Term-Mass-Full-Agent-Bench-Plan-v1.0.md) |
| **GO token** | [`agents/go/GC0-W0.md`](../go/GC0-W0.md) **UNSTAMPED** |
| Parent | Heatmap Templates v0.2.4 · frozen `gex` (`gex_v1`) · LIM v0.4.7 sibling (never fused) |

**Not BUILD AUTHORITY.** No product-code seed fires until Coach stamps `GC0-W0` (GC0-0) and JR8.

## Owns

Frozen **`gex_v1` generations**. Heatmap template id `gex-cal`. Picker **Term Mass**. Route tree: Options Lab **heatmap** (not volume-profile).

## Does not

- `VPS*` / `VPSB*` / `SADEV*` namespaces  
- VP stores (`{LABS_MARKET_DATA_ROOT}/vp/`)  
- VP surfaces (`/app/options-lab/volume-profile`)  
- The VP program's future **heatmap overlay** (SA-edges consumer) — **distinct product**  
- Shared Labs component changes without Coach  
- Collector contention (collectors win)

## Conflicts

STOP, report to Coach. Never instance-to-instance.
