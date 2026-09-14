# Practice — Member UX Findings Register v1.0

**Status:** Running findings register (append-only, living). For Juliet to slot; **Echo + Tango** own the fixes.
**Date opened:** 2026-09-14 · **Last updated:** 2026-09-14 (FI-PPL-9 refined)
**Class:** Presentation / member comprehension. **Track A chrome / B1 betterment**, NOT B0 correctness. These do not widen PPL0–PPL4 packets.
**Machine:** StudioTwo (`StudioTwo.local`), :3000 / :4000.

Coach’s full write-up of FI-PPL-3…9 (2026-09-14) is the product intent. Implementation landed on StudioTwo in the same session as this file.

| ID | One line | Status |
|----|----------|--------|
| **FI-PPL-3** | Completed-position drawer: affirmation first; Edit / Remove close / Delete entire position last | **BUILD** (this session) |
| **FI-PPL-4** | Row click toggles the detail drawer; checkbox stays bulk-only | **BUILD** |
| **FI-PPL-5** | Remove “Trade details” heading; consistent fields, no false affordance | **BUILD** |
| **FI-PPL-6** | Chart intervals: 5 min · 30 min · 2 hr · 4 hr · Day | **BUILD** (15m remains valid on the API for old calls) |
| **FI-PPL-7** | Strategy read-only on existing trades | **BUILD** (API re-key 422 is PPL3) |
| **FI-PPL-8** | Legs primary; hide → ToS script / preview, never “built automatically” | **BUILD** |
| **FI-PPL-9** | Process notes → two-way day’s Journal composer in the drawer | **BUILD** (day session, not a second store; `journal_entry_id` not revived) |

## Document history

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-09-14 | Register opened from Coach live walk. FI-PPL-3…9 as specified. |
