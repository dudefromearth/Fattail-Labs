# Requirements Ledger (RL-1)

Canonical capture of Coach requirements. Wording preserved. Close only by **AP-1** (Coach acceptance) or explicit withdraw.

Status: `OPEN` · `AP-1` · `WITHDRAWN`

## Open

| ID | Captured | Track | Status | Coach wording |
|----|----------|-------|--------|-----------------|
| **REQ-001** | 2026-09-19 | VP | OPEN | See full row below. |
| **REQ-002** | 2026-09-19 | VP settings | OPEN | See full row below. |

### REQ-001 — ≥ 90 days of price on the chart (VP confirmation blocker)

**Captured:** 2026-09-19 (this session).  
**Track:** Volume Profile. **Priority: now.** Nothing else advances on the VP track first.

**Coach wording (addendum, 2026-09-19):**

> REQ-001 is not an enhancement. Without >= 90 days of price on the chart, Coach cannot validate the volume profile against known price structure — the VP product itself is UNCONFIRMED until this lands. Priority: now. Nothing else advances on the VP track first.
>
> Add one step after acceptance: Coach performs the visual cross-check — profile nodes and gaps against 3 months of price he knows. HIS confirmation, not the screenshot, is what marks the VP instrument CONFIRMED on the board. The screenshot only closes the range requirement.

**Prior statement (no row — process defect, RL-1):** Data Delivery v1.0 D1 / T1: “at least 3 months of downloadable price history” / pan ES 5m through ≥ 3 months. Restated here as REQ-001.

**Acceptance split:**
1. **Range requirement** — screenshot of ≥ 90 days of price on the chart closes REQ-001's *range* half.
2. **Instrument CONFIRMED** — only Coach's visual cross-check (nodes/gaps vs 3 months of price he knows). Not the screenshot.

**Closes:** AP-1 or Coach withdraw. Not closed.

### REQ-002 v2 — match the TV dialog exactly

**Captured:** 2026-09-19.  
**Track:** VP / SA settings chrome.

**Coach wording (RL-1):**

> the same layout, the same control elements and components, the same sizes, everything the same as TV.

**Visual contract:** `artifacts/references/REQ-002-settings-dialog-reference.png`  
**Git blob:** `bf9fa21ac600cfe0432f2651dcee9080d55258f4`  
**Spec:** `Specs/REQ-002-TV-Settings-Dialog-Fidelity-Spec-v2.md`  
**Measurement:** `artifacts/references/REQ-002-measurement-spec.md`

If that file is not on `main` at that blob, the packet does not dispatch — ask Coach, don't substitute another screenshot.

**Acceptance — AP-1 / PP-1:** side-by-side AND overlay vs the reference; deviations enumerated (target: none beyond clause 5). Closure: verified in Coach's own browser on StudioTwo, opened by his right-click.

**Closes:** AP-1 or Coach withdraw. Not closed.

## Closed

_(none)_
