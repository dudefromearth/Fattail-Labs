# HW-W0 — Help Watch + Wiki Follow · GO token

**Machine:** StudioTwo — FatTail Labs repo.  
**Board:** [`agents/p-help-watch/`](../p-help-watch/)  
**Land path:** `agents/go/HW-W0.md`  
**Date drafted:** 2026-09-15  
**Amended:** 2026-09-15 — spec v0.3 retrospective sweep; calibration window = sweep PRs  
**Status:** **STAMPED GO** — 2026-09-15. Chat is not the stamp; this file is (**DL-328**). **DL-704.** Straight-to-main remains **unticked**.

## Authority

- Spec: [`Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md`](../../Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md)
  (**BUILD AUTHORITY** for this board upon this stamp; v0.2 and v0.1
  frozen baselines)
- Parents (unchanged, not re-opened): Help Concierge v1.2 (whitelist,
  DL-572), Wiki Source Contract v0.1.4 (L4/L9/L11/L12,
  poll≠subscribe), Wiki Authoring Agent DRAFT v0.1
- ODs ticked in v0.2 (stand in v0.3): HW-1 ladder · HW-2 new seat · HW-3 explicit
  allowlist §2.8 · HW-4 follow-on same-day never same-SHA ·
  HW-5 StudioTwo only

**Cite check (2026-09-15, StudioTwo):** spec found at the **dotted** path `…-v0.3.md`. No `v0_3.md` underscore twin. Filename matches the token cite.

## Coach ticks (all required)

- [x] Spec v0.3 is BUILD AUTHORITY for this board
- [x] Callsign for the Help Watch seat (HW-2 close-out): **Sierra**
- [x] Calibration window = the retrospective sweep’s PRs  
      (one PR per app area; Coach reviews each batch. Not a “first N
      git-replay runs.” Straight-to-main is a LATER tick on this token,
      earned per HW-1 after the sweep is fully merged and precision is
      shown — leave that tick unticked today)
- [ ] Straight-to-main enabled (DO NOT TICK at stamp time — ticked
      only after the sweep is fully merged and the calibration report
      shows precision)

## What this token authorizes

- **HW0 — seating:** create the board, watermark file
  (`agents/p-help-watch/watermark.json`, initialized to the current
  origin/main SHA, `sweep_status: pending`), seed files, the named seat. No product code,
  no Help writes.
- **HW1 — retrospective sweep (the calibration window):** compare
  current as-built app surfaces to current `server/help_reference/*.md`,
  surface by surface (spec §2.0). **Not** a git-history replay.
  Output: catch-up updates, **one PR per app area** touching
  `server/help_reference/*.md` only, plus `agents/p-help-watch/sweep-skipped.md`
  with named reasons. The **Trade Log** PR must teach
  **partial-residual / 422 / 409**. Must not touch unchanged surfaces
  in that PR. Coach reviews **each** batch — merge or reject; the
  merge decision is calibration evidence, filed on the board.
  The window is satisfied by those sweep PRs. Straight-to-main stays
  blank until the sweep is **fully merged** and precision is shown.
- **Wiki Follow:** no new authorization needed — the existing S1
  poller follows published Help on its own cadence after each PR
  merges. Zero changes to the poller in this token.

## What this token does not authorize

- Straight-to-main Help commits (separate tick, earned after sweep close)
- Any write outside `server/help_reference/*.md` and the board's own
  `agents/p-help-watch/` files
- Product trees, Specs/ (flag drift, never rewrite), Wiki pages,
  concierge read path, matcher, Analyzer, LIM/QFRIC/XS
- MiniTwo — anything on production (HW-5)
- Changes to Wiki poll mechanics (poll≠subscribe stands)
- Git-history replay of PPL2/PPL3 as the first job (superseded by the sweep)

## Stop conditions

- Spec v0.3 not found at the cited path, or cite/filename mismatch
  anywhere in the chain (dot/underscore included) → stop, report
- A sweep PR would touch any file outside `help_reference/` →
  the run is FAIL, file the diff as evidence, do not open the PR
- Watermark file missing or ahead of origin/main → stop, report
- Any tick above unmarked → nothing fires

## Gate

HW1-G: Coach reviews **each** sweep app-area PR — merged (with or
without edits, edits filed as decode misses) or rejected (reasons
filed). Gate report: `agents/p-help-watch/gate-reports/HW1-G.md`
(updated per batch; sweep closed when every area is merged or
skipped with reason). Then, and only then, Coach considers the
straight-to-main tick. The Trade Log batch is FAIL unless
partial-residual / 422 / 409 appear in the merged Help.

## Stamp

**STAMPED 2026-09-15** by Coach: v0.3 authority · **Sierra** · sweep is the calibration window. Straight-to-main **blank**.

| Tick | Coach |
|------|-------|
| Spec v0.3 BUILD AUTHORITY | ☑ 2026-09-15 |
| Callsign | ☑ **Sierra** |
| Calibration window = sweep PRs (each batch reviewed) | ☑ |
| Straight-to-main | ☐ **do not tick at stamp** — after sweep fully merged + precision |

HW0 seating is authorized. HW1 sweep PRs next. No Help writes in HW0. No MiniTwo.
