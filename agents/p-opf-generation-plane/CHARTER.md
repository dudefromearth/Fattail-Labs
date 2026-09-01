# Charter — OPF Generation Plane board

**Program:** OPF Generation Plane (GP)  
**Plan:** [`docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md`](../../docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md) **v1.1 + errata**  
**Law:** [`Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md`](../../Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md)

## Mission

Make L1 real: the server obtains a generation it owns, and stamps which book it is (`wings` or `listed`). Staged freeze lift for later GEX compute. **This board does not compute exposure.**

## Invariants

1. GP1 — analytics never reads a client-posted book.  
2. GP1a — pricing what-if POST path is not broken.  
3. GP7 — no wing-window value labelled chain GEX.  
4. GP11 — hydrator in-process; never Massive.  
5. OD-GP1 — no `archive_put`.  
6. **GP21 erratum — plane interest is wings-only; listed pairs are not registered as interest.**  
7. DL-539 — three successive Coach OKs before editing existing-work files.  
8. Seeds only; Delta ternary; Coach overrule via DL.

## Out

GEX compute · L4-A route · Surface · Profile · Card · StudioOne dash · Time Machine · Heatmap HM17/HM18 · templates · shared-plane store move.
