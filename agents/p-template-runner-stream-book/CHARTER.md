# Project: Template Runner Stream Book

**Board:** `agents/p-template-runner-stream-book/`  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Plans

| Program | Path |
|---------|------|
| **Active — Stream Book (plan v1.0.4)** | [`docs/Template-Runner-Stream-Book-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Template-Runner-Stream-Book-Full-Agent-Bench-Plan-v1.0.md) · reviews [`reviews/`](./reviews/) |

## Specs / Arch

| Doc | Path |
|-----|------|
| Template Runner Spec | [`Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`](../../Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md) — add **TR14** (do not reuse **TR13**) |
| Width Fit Spec v0.1.1 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) |
| Echo labels | [`echo-labels.md`](./echo-labels.md) |
| OPF Truth · DL-309 | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) |

## Mission

Ship a **client-side Runner stream book** shared by every provisioned template. Width Fit this version ships **both** the **MA heatmap** (K×w tiles) **and** the **ranking sheet** ([`evidence/width-fit-ui.png`](./evidence/width-fit-ui.png)). Live \| Average (and later Scrubber) select streams; Heatmap \| Ranking selects the sink. Same aggregates. Chrome is **Apple HIG** (Echo). Templates stay pure.

## Invariants

- Client only; relieves the server; member budget binds; drop-oldest  
- TR5 / WF4 / HM6 purity — no cache inside template `compute`  
- One MarketSocket; no client Massive  
- No interpolated ticks (DL-309)  
- TR14 ≠ TR13 (IKI-P3 host chrome)  
- Echo before chrome; ≥44 pt; tokens; reduced-motion  
- Observation-only vocabulary  
- Delta ternary; no waive  

## Out of scope

- SSR / Arch 31  
- Raising `FLY_HISTORY_DEPTH`  
- IndexedDB v1  
- MiniTwo unless Coach asks  
- Reopening IKI-P3 TR13  
- MA math in `widthFit.ts`  

## Coordination

| Board | Touch |
|-------|--------|
| `p-options-lab-heatmap-width-fit` | Consume Width Fit; do not put history in the template |
| `p-template-runner` | Consume registry / run / host; add stream book |
| `p-iki-lab` | TR13 untouched; host may **read** the same book later |
| `p-market-bus` | Same OPF-held generation |

## Status

**SB0** — plan on disk. **SB0-0 not stamped.** No SB1 code.
