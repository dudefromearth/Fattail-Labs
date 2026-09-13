# Project: Options Lab XSP / SPY Scale

**Board:** `agents/p-options-lab-xsp-spy-scale/`  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Plans

| Program | Path |
|---------|------|
| **Active — XSP/SPY scale (plan v1.3)** | [`docs/Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.3.md`](../../docs/Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.3.md) |

## Specs / Arch

| Doc | Path |
|-----|------|
| Analyzer Spec **v0.2.1** | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) · **AZ-DEF-4** |
| Create / Edit Dialog Spec **v0.13** | [`Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_13.md`](../../Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_13.md) · **AT-DLG-22** Width struck |
| Advanced Fly Spec **v0.2.1** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) · **DL-435** remainder |
| Width Fit Spec **v0.1.1 BUILD AUTHORITY** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) · closed WF1–WF5 · **DL-526** |
| OPF Truth · **DL-309** | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) |
| Arch 29 | [`Architecture/29-options-lab-heatmap-templates.md`](../../Architecture/29-options-lab-heatmap-templates.md) |

## Mission

Reconnect remaining XSP/SPY fly-scale consumers (heatmap columns, Create butterfly recipes, listed snap honesty) to the universe overlay **1–7** (or the minimum listed wing), without moving SPX/NDX/RUT/VIX, without touching `fetch_step_floor` or `defaultWidth`, and without reopening Advanced Fly Wave-1 or Width Fit math.

## Invariants (non-negotiable)

- Universe overlay is scale SoR; kind-default must not paint as overlay
- **AZ-DEF-4:** never invent unlisted arithmetic width
- **DL-435 remainder:** SPX-class heatmap stays 10…50 until a **new DL** in the heatmap PR
- Do not mutate `HEATMAP_FLY_WIDTHS`
- **HM8:** unlisted \(K \pm w\) → invalid cell, never snap
- **AT-DLG-22:** no Width / Centre / structure Expiration controls
- `AnalyzerPositionsList.tsx` is not in the diff
- `fetch_step_floor` is not in the diff
- `defaultWidth` is not in the diff (WIDTH-1 Keep)
- No LIM file, no QFRIC file
- Delta ternary only; no waive
- **NX18:** a passing XS gate is not IKI progress

## Out of scope

- Re-plan or re-do WIDTH-1 (`a27f187`)
- Reopening Width Fit (`p-options-lab-heatmap-width-fit` WF1–WF5) or Advanced Fly AF0–AF-Z
- Implementing leftover **AF-X**
- Restore Create Width picker (L3 LOCKED)
- MiniTwo unless Coach names it
- IKI Labs / `observer-light` / Factory catalog (**NX18**)
- QQQ / IWM heatmap 10…50 (**XS-ETF**, deferred)

## Coordination

| Board | Touch |
|-------|--------|
| `p-options-lab-heatmap-width-fit` | Closed. Historical WIDTH-1 shots stay. **Do not reopen** |
| `p-options-lab-heatmap` | Consume as-built `sym-fly`; **do not** fire AF-X |
| `p-options-lab-heatmap-lim` | Active. Do not touch LIM files |
| `p-quant-friction` | Active. No quant files |
| `p-options-lab-create-edit-dialog` | Sequence XS1 behind if that GO is open. No chrome / padlock / `defaultWidth` |

## Status

**XS0-0 GO** · **DL-700**. Plan **v1.3**. WIDTH-1 `a27f187` prerequisite.
